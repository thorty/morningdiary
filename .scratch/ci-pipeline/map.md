# Map: CI pipeline

Label: wayfinder:map

## Destination

A written CI plan (`.scratch/ci-pipeline/spec.md`) that is ready to hand to an implementation session. Planning only: no workflow files are built as part of this map.

## Notes

- Repo: `thorty/morningdiary`, GitHub free account, deployed later to a custom server (network and certificates are out of scope).
- Existing: backend `pytest` + `mypy --strict` (uv), frontend `vitest` + `tsc` (npm), two Dockerfiles, no CI yet.
- Consult `GLOSSARY.md` and `docs/adr/` for vocabulary.
- Keep rounds small: the user is easily overwhelmed by many questions. One ticket per session.

## Decisions so far

- Direction (from earlier discussion): tests, coverage report (no threshold yet), dependency audit, secret scan, CodeQL, Dependabot, linting (Ruff, ESLint), Docker smoke build plus Trivy scan with no push; the CI ships nothing.

- [Repo visibility](issues/01-repo-visibility.md): public, so CodeQL and secret scanning are free.
- [Job layout and gates](issues/02-job-layout-and-gates.md): one ci.yml (backend, frontend, secrets, then docker) plus codeql.yml; PR-only merges to main with those four checks required.
- [Findings policy](issues/03-findings-policy.md): HIGH/CRITICAL fail, exceptions need written justification; start red on default lint rules, fix, re-run; enable branch protection once green.

## Not yet specified

- Coverage threshold: set after the first measured value.
- Hand-off order for implementation (which workflow first).

## Out of scope

- Deployment to the custom server, networking, certificates.
- Pushing images to a registry.
