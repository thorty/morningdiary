"""Fail Python dependency audits only for HIGH/CRITICAL vulnerabilities."""

from __future__ import annotations

import json
import sys
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen

from cvss import CVSS2, CVSS3, CVSS4


def get_severity(advisory_id: str) -> str:
    """Resolve an OSV advisory's severity, failing closed if it is unavailable."""
    try:
        with urlopen(f"https://api.osv.dev/v1/vulns/{advisory_id}", timeout=15) as response:
            advisory: dict[str, Any] = json.load(response)
    except (OSError, URLError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Could not retrieve severity for {advisory_id}: {error}") from error

    explicit = advisory.get("database_specific", {}).get("severity")
    if isinstance(explicit, str):
        normalized = explicit.upper()
        if normalized in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}:
            return normalized
        if normalized == "MODERATE":
            return "MEDIUM"

    severity_by_score = (
        ("CRITICAL", 9.0),
        ("HIGH", 7.0),
        ("MEDIUM", 4.0),
        ("LOW", 0.0),
    )
    scores: list[float] = []
    for rating in advisory.get("severity", []):
        vector = rating.get("score")
        if not isinstance(vector, str):
            continue
        try:
            if vector.startswith("CVSS:4"):
                score = CVSS4(vector).scores()[0]
            elif vector.startswith("CVSS:3"):
                score = CVSS3(vector).scores()[0]
            else:
                score = CVSS2(vector).scores()[0]
        except (ValueError, TypeError):
            continue
        scores.append(score)

    if scores:
        highest_score = max(scores)
        return next(severity for severity, minimum in severity_by_score if highest_score >= minimum)

    raise RuntimeError(f"No usable severity metadata for {advisory_id}")


def load_exceptions(path: str) -> dict[str, Any]:
    try:
        with open(path, encoding="utf-8") as exception_file:
            exceptions: dict[str, Any] = json.load(exception_file)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(f"Could not read Python audit exceptions: {error}") from error

    python_exceptions = exceptions.get("python", {})
    if not isinstance(python_exceptions, dict):
        raise TypeError("The 'python' exceptions entry must be an object keyed by advisory ID.")
    for advisory_id, exception in python_exceptions.items():
        if (
            not isinstance(exception, dict)
            or not isinstance(exception.get("package"), str)
            or not exception["package"].strip()
            or not isinstance(exception.get("reason"), str)
            or not exception["reason"].strip()
            or exception.get("severity") not in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
            or not isinstance(exception.get("owner"), str)
            or not exception["owner"].strip()
            or not isinstance(exception.get("review_by"), str)
            or not exception["review_by"].strip()
        ):
            raise RuntimeError(
                f"Invalid exception for {advisory_id}: package, severity, reason, owner, and review_by are required."
            )
    return python_exceptions


def main() -> int:
    if len(sys.argv) != 4:
        print(
            "Usage: audit_python.py <pip-audit-report.json> <pip-audit-exit-code> <exceptions.json>",
            file=sys.stderr,
        )
        return 2

    try:
        with open(sys.argv[1], encoding="utf-8") as report_file:
            report: dict[str, Any] = json.load(report_file)
    except (OSError, json.JSONDecodeError) as error:
        print(f"Could not read pip-audit report: {error}", file=sys.stderr)
        return 2

    audit_status = int(sys.argv[2])
    try:
        exceptions = load_exceptions(sys.argv[3])
    except RuntimeError as error:
        print(error, file=sys.stderr)
        return 2

    vulnerabilities = [
        (dependency["name"], dependency["version"], vulnerability)
        for dependency in report.get("dependencies", [])
        for vulnerability in dependency.get("vulns", [])
    ]
    if not vulnerabilities:
        if audit_status != 0:
            print("pip-audit failed without reporting vulnerabilities.", file=sys.stderr)
            return audit_status
        print("No production Python dependency vulnerabilities found.")
        return 0

    has_blocking_finding = False
    for package, version, vulnerability in vulnerabilities:
        advisory_id = vulnerability["id"]
        try:
            severity = get_severity(advisory_id)
        except RuntimeError as error:
            print(error, file=sys.stderr)
            return 2

        exception = exceptions.get(advisory_id)
        if exception is not None:
            if (
                exception.get("package") != package
                or exception.get("severity") != severity
            ):
                print(
                    f"Invalid exception for {advisory_id}: package or severity does not match the live finding.",
                    file=sys.stderr,
                )
                return 2
            print(
                f"EXCEPTED: {package} {version} — {advisory_id}: {exception['reason']} "
                f"(owner: {exception['owner']}; review by: {exception['review_by']})"
            )
            continue

        fix_versions = ", ".join(vulnerability.get("fix_versions", [])) or "no fix available"
        print(f"{severity}: {package} {version} — {advisory_id} (fix: {fix_versions})")
        has_blocking_finding |= severity in {"HIGH", "CRITICAL"}

    if has_blocking_finding:
        return 1
    if audit_status != 0:
        print("Only MEDIUM/LOW vulnerabilities were found; reporting without failing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
