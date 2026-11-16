Type: grilling
Status: resolved
Blocked by: 02

## Question

How strict is the pipeline about findings (fail on HIGH/CRITICAL?), how are exceptions documented, and how are the first existing lint findings handled?

## Progress

- Strictness settled: HIGH/CRITICAL findings (Trivy, npm audit, pip-audit) fail the pipeline; MEDIUM/LOW are shown only. Exceptions only via an ignore file with written justification.

## Answer

HIGH/CRITICAL findings fail the pipeline; MEDIUM/LOW are shown only; exceptions only via an ignore file with written justification. Ruff and ESLint start on default rules. The first run may be red: fix the initial findings afterwards and re-run. Branch protection with required checks is switched on only once the pipeline is green, so main is never blocked.
