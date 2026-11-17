# CI/CD Pipeline Overview

This document explains how the repository's GitHub Actions pipeline is organized, where its checks and thresholds are configured, and how a change moves from a pull request to a merge. The pipeline validates and scans changes; it does not deploy the application or publish Docker images.

## Workflows and triggers

- [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs for every pull request and for pushes to `main`.
- [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) runs on pull requests and weekly (Monday at 03:23 UTC). It analyzes Python and JavaScript/TypeScript and uploads findings to GitHub Security. It is informational rather than a required merge check.

## Main CI workflow

The main workflow starts three independent jobs in parallel:

### `backend`

1. Checks out the repository and configures Python 3.12 and `uv`.
2. Installs the locked backend dependencies with `uv sync --frozen --dev`.
3. Runs Ruff linting and strict mypy type checking.
4. Runs pytest with coverage and publishes the report in the GitHub Actions job summary. Coverage must be at least **85% overall**; the gate is `--cov-fail-under=85` in the pytest command.
5. Exports production dependencies and audits them with `pip-audit`. The severity policy is implemented in [`.github/scripts/audit_python.py`](../../.github/scripts/audit_python.py): HIGH and CRITICAL findings fail the job; MEDIUM and LOW findings are reported without failing it. Severity is resolved from OSV metadata, with CVSS score mapping as a fallback.

### `frontend`

1. Checks out the repository, configures Node.js 22, and installs exact lockfile dependencies with `npm ci`.
2. Runs ESLint and TypeScript type checking.
3. Runs Vitest with V8 coverage and adds a coverage table to the job summary. The thresholds are configured in [`frontend/vitest.config.ts`](../../frontend/vitest.config.ts): at least **85% for statements, branches, functions, and lines**.
4. Audits production npm dependencies with `npm audit --omit=dev`. The severity policy is implemented in [`.github/scripts/audit_npm.mjs`](../../.github/scripts/audit_npm.mjs): HIGH and CRITICAL findings fail the job; MEDIUM and LOW findings are reported without failing it.

### `secrets`

Checks out the full Git history and runs Gitleaks. A detected secret fails the check. The job has no severity threshold; its command uses `--exit-code=1` for findings.

### `docker`

This job starts only after `backend`, `frontend`, and `secrets` succeed. It builds backend and frontend images as smoke-test targets and does not push them to a registry. Trivy scans both images:

- HIGH and CRITICAL vulnerabilities with an available fix are blocking.
- Findings without a fix are ignored (`ignore-unfixed: true`).
- The gate uses `severity: HIGH,CRITICAL` and `exit-code: "1"`; scan results are also emitted as SARIF and uploaded to GitHub Security.
- [`.trivyignore`](../../.trivyignore) is the exception file for vulnerability IDs; exceptions should have a written justification.

## Exception handling

Dependency audit exceptions are kept in [`.github/audit-exceptions.json`](../../.github/audit-exceptions.json), separated into `python` and `npm` entries. Each exception must identify the advisory and package and include the severity, reason, owner, and review date (`review_by`). The current exception lists are empty. Python and npm audit logic checks that an exception still matches the live finding rather than silently suppressing changed findings.

## Merge gates and security reporting

The required checks for `main` are `backend`, `frontend`, `secrets`, and `docker`. Branch protection requires pull requests and passing checks before merge; auto-merge is disabled. CodeQL findings are uploaded separately and do not currently block merges.

## Where to look when a check fails

| Check | Configuration or implementation |
| --- | --- |
| Workflow triggers, job order, lint, type checks, tests | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| Backend coverage minimum | `--cov-fail-under=85` in the backend pytest step in `ci.yml` |
| Frontend coverage minimums | [`frontend/vitest.config.ts`](../../frontend/vitest.config.ts) |
| Python dependency severity and exceptions | [`.github/scripts/audit_python.py`](../../.github/scripts/audit_python.py), [`.github/audit-exceptions.json`](../../.github/audit-exceptions.json) |
| npm dependency severity and exceptions | [`.github/scripts/audit_npm.mjs`](../../.github/scripts/audit_npm.mjs), [`.github/audit-exceptions.json`](../../.github/audit-exceptions.json) |
| Docker image scan severity and exception file | Trivy steps in `ci.yml`, [`.trivyignore`](../../.trivyignore) |
| Secret scanning | Gitleaks step in `ci.yml` |
| Code scanning | [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) |

## Vocabulary: CI versus CD

Here, **continuous integration (CI)** means that code changes are automatically linted, type-checked, tested, and scanned. The workflow currently does **not** implement continuous delivery or deployment (CD): it neither publishes images nor deploys to the self-hosted server. Deployment remains a separate manual process.
