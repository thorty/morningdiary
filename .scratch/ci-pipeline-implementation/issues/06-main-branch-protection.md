# 06: Enable main-branch protection

**What to build:** After the first green pipeline run, changes to `main` can land only through a pull request with all agreed required checks passing.

**Blocked by:** 03: Build and scan Docker images in CI.

**Status:** completed

- [x] Branch protection is enabled only after the first green pipeline run.
- [x] Direct changes to `main` are disallowed; a pull request is required.
- [x] The `backend`, `frontend`, `secrets`, and `docker` checks must pass before merge.
- [x] Auto-merge remains disabled, including for Dependabot pull requests.
