# Dependency and secret-scan exceptions

There are currently no accepted dependency-audit or secret-scan exceptions.

For Python dependency findings, add the advisory ID under `python` in
`audit-exceptions.json`, with the exact package, written reason, owner, severity,
and `review_by` date. The audit job validates each exception against the report.

For npm findings, add the advisory ID under `npm` in the same file with the
exact package, severity, written reason, owner, and `review_by` date. The
frontend audit job validates each exception against the npm report.

For secret findings, add the exact fingerprint to `.gitleaksignore` and
record the fingerprint, affected file, severity, written reason, owner, and
review-by date below before suppressing it. Suppressions without written
justification are not permitted.

## Accepted exceptions

None.
