# 02: Add the core pull-request CI checks

**What to build:** Pull requests and pushes to `main` automatically run backend and frontend quality checks, dependency audits, and a full-history secret scan, with coverage visible in the run summary.

**Blocked by:** 01: Add local lint and coverage tooling.

**Status:** completed

- [x] Backend and frontend lint, type checks, and tests run in parallel on pull requests and pushes to `main`.
- [x] Each service reports coverage in the workflow summary without enforcing a threshold.
- [x] Production dependency audits run for Python and npm; HIGH and CRITICAL findings fail, while MEDIUM and LOW findings are reported without failing.
- [x] A full-history secret scan runs as a required check.
- [x] Any audit or secret-scan exceptions are recorded with written justifications.
- [x] The initial run can surface existing lint findings; the checks are rerun until the pipeline is green.
