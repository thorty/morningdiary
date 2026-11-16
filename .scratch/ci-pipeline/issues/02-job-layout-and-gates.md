Type: grilling
Status: resolved
Blocked by: 01

## Question

Which jobs make up the pipeline, in what order, and which are required to merge into `main`? Covers: lint/typecheck/tests per service, coverage report, audits, secret scan, CodeQL, Docker smoke build + Trivy.

## Progress

- Merge rule settled: `main` only changes via Pull Request with green required checks, also for the sole maintainer; no auto-merge (Dependabot PRs merged manually).

## Answer

One `ci.yml` with parallel jobs `backend`, `frontend`, `secrets`, then `docker` (smoke build + Trivy, no push) gated on the others. Separate `codeql.yml` (PRs + weekly), informational at first. Required checks on `main`: backend, frontend, secrets, docker.
