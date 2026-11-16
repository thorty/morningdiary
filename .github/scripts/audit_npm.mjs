import { readFile } from "node:fs/promises";

const [reportPath, exceptionsPath, auditExitCode] = process.argv.slice(2);
if (!reportPath || !exceptionsPath || auditExitCode === undefined) {
  console.error("Usage: node audit_npm.mjs <npm-audit.json> <exceptions.json> <npm-audit-exit-code>");
  process.exit(2);
}

const report = JSON.parse(await readFile(reportPath, "utf8"));
const { npm: exceptions = {} } = JSON.parse(await readFile(exceptionsPath, "utf8"));
const vulnerabilities = Object.entries(report.vulnerabilities ?? {});
if (vulnerabilities.length === 0) {
  if (Number(auditExitCode) !== 0) {
    console.error("npm audit failed without reporting vulnerabilities.");
    process.exit(Number(auditExitCode));
  }
  console.log("No production npm dependency vulnerabilities found.");
  process.exit(0);
}

let hasBlockingFinding = false;
const normalizeSeverity = (severity) => {
  const normalized = severity.toUpperCase();
  return normalized === "MODERATE" ? "MEDIUM" : normalized;
};
for (const [packageName, vulnerability] of vulnerabilities) {
  for (const advisory of vulnerability.via.filter((item) => typeof item === "object")) {
    const advisoryId = String(advisory.source);
    const severity = normalizeSeverity(advisory.severity);
    const exception = exceptions[advisoryId];
    if (exception) {
      if (
        exception.package !== packageName ||
        exception.severity !== severity ||
        typeof exception.reason !== "string" ||
        exception.reason.trim() === "" ||
        typeof exception.owner !== "string" ||
        exception.owner.trim() === "" ||
        typeof exception.review_by !== "string" ||
        exception.review_by.trim() === ""
      ) {
        console.error(`Invalid exception for npm advisory ${advisoryId}: package, severity, reason, owner, or review_by does not match.`);
        process.exit(2);
      }
      console.log(`EXCEPTED: ${packageName} — ${advisoryId}: ${exception.reason} (owner: ${exception.owner}; review by: ${exception.review_by})`);
      continue;
    }

    console.log(`${severity}: ${packageName} — ${advisory.title} (${advisory.url})`);
    hasBlockingFinding ||= ["HIGH", "CRITICAL"].includes(severity);
  }
}

if (hasBlockingFinding) process.exit(1);
console.log("Only MEDIUM/LOW vulnerabilities were found or excepted; reporting without failing.");
