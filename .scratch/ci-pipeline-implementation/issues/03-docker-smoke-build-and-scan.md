# 03: Build and scan Docker images in CI

**What to build:** After the core pull-request checks pass, CI smoke-builds and scans both Docker images without publishing them.

**Blocked by:** 02: Add the core pull-request CI checks.

**Status:** ready-for-agent

- [ ] The Docker job starts only after the backend, frontend, and secrets checks pass.
- [ ] Both images are built as CI-only smoke-test targets and are never pushed to a registry.
- [ ] Trivy scans both images; HIGH and CRITICAL findings fail the job, while MEDIUM and LOW findings are reported without failing.
- [ ] Unfixed vulnerabilities are ignored as specified, and any exceptions include written justifications.
- [ ] SARIF scan results are uploaded to the GitHub Security tab.
