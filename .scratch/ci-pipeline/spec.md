Status: ready-for-agent

# Spec: CI pipeline for Morning Coach

## Problem Statement

The repository `thorty/morningdiary` (public, GitHub free account) has backend tests (pytest, mypy strict) and frontend tests (vitest, tsc) but no automation. Nothing runs them on a change, nothing checks dependencies, secrets or container images for vulnerabilities, and nothing stops a broken change from reaching `main`. The maintainer wants this safety net without deploying anything from GitHub: the app is deployed by hand to a custom server.

## Solution

Add a GitHub Actions pipeline that runs on every pull request and on pushes to `main`. It runs lint, type checks and tests with a coverage report for both services, audits dependencies, scans for committed secrets, does a smoke build of both Docker images and scans them. A separate scheduled code scan covers Python and TypeScript. Dependabot keeps dependencies and actions current. The pipeline ships nothing.

## User Stories

1. As the maintainer, I want tests to run automatically on every pull request, so that I notice breakage before merging.
2. As the maintainer, I want backend lint, mypy and pytest to run, so that Python regressions are caught.
3. As the maintainer, I want frontend lint, tsc and vitest to run, so that TypeScript regressions are caught.
4. As the maintainer, I want a coverage report in each run's summary, so that I can see how well the code is tested.
5. As the maintainer, I want no coverage threshold at first, so that the first run does not fail on an arbitrary number.
6. As the maintainer, I want a threshold set slightly below the first measured value later, so that coverage cannot silently drop.
7. As the maintainer, I want Python dependencies audited, so that known vulnerable packages are flagged.
8. As the maintainer, I want production npm dependencies audited, so that known vulnerable packages are flagged.
9. As the maintainer, I want committed secrets detected, so that an OpenAI key never lands in the repository.
10. As the maintainer, I want both Docker images built in CI, so that Dockerfile breakage shows up in the pull request.
11. As the maintainer, I want the built images scanned for HIGH and CRITICAL vulnerabilities, so that base-image problems are found.
12. As the maintainer, I want scan results in the GitHub Security tab, so that I can review them in one place.
13. As the maintainer, I want a code scan for Python and TypeScript that runs on pull requests and weekly, so that insecure code patterns are found.
14. As the maintainer, I want Dependabot pull requests for uv, npm, Docker and GitHub Actions, so that updates arrive without effort.
15. As the maintainer, I want Dependabot pull requests to pass the same pipeline, so that updates are verified.
16. As the maintainer, I want HIGH and CRITICAL findings to fail the pipeline, so that serious issues are not ignored.
17. As the maintainer, I want MEDIUM and LOW findings only shown, so that noise does not block work.
18. As the maintainer, I want exceptions only through an ignore file with a written reason, so that suppressions stay deliberate and traceable.
19. As the maintainer, I want the Docker job to start only after the other jobs are green, so that CI time is not wasted on broken code.
20. As the maintainer, I want the pipeline to ship no images, so that the hand deployment with its network and certificate setup stays untouched.
21. As the maintainer, I want the first pipeline run allowed to be red, so that lint findings in existing code are visible and then fixed in a follow-up.
22. As the maintainer, I want `main` to accept changes only via pull request with green required checks, so that a broken change cannot land.
23. As the maintainer, I want that protection enabled only after the first green run, so that `main` is never blocked by the initial findings.
24. As the maintainer, I want no auto-merge, so that I review every Dependabot pull request.

## Implementation Decisions

- One main workflow with parallel jobs `backend`, `frontend` and `secrets`, followed by a `docker` job that depends on all three.
- A separate code-scan workflow (CodeQL for Python and JavaScript/TypeScript) on pull requests and weekly. It is informational at first and not a required check.
- Backend job: uv with frozen lockfile, Ruff, mypy strict, pytest with coverage written to the job summary, pip-audit over production dependencies.
- Frontend job: npm ci, ESLint, tsc, vitest with v8 coverage written to the job summary, npm audit for production dependencies at level high.
- Secrets job: Gitleaks over the full history.
- Docker job: matrix over backend and frontend, build only (no push), Trivy scan with HIGH and CRITICAL failing, unfixed vulnerabilities ignored, SARIF uploaded to the Security tab.
- Images built in CI are only smoke-test and scan targets. The frontend bakes the backend URL in at build time, so such an image would be wrong for the custom server; real builds stay on the server.
- New dev dependencies are needed: Ruff and pytest-cov for the backend; ESLint with the Next.js config and the vitest v8 coverage plugin for the frontend. Lockfiles must be updated with them, and a `lint` script is needed in the frontend.
- Lint rules start at defaults without loosening.
- Dependabot: weekly for uv, npm, both Dockerfiles and GitHub Actions.
- Exceptions to audit and scan findings live in ignore files, each entry with a written justification.
- Branch protection on `main`: pull request required, checks `backend`, `frontend`, `secrets`, `docker` required, no auto-merge. Enabled after the first green run.
- Suggested order: (1) add lint and coverage tooling locally, (2) main workflow, (3) run, fix initial findings, re-run until green, (4) code-scan workflow and Dependabot, (5) enable branch protection, (6) set the coverage threshold.

## Testing Decisions

- The single seam is a pipeline run on a pull request: it ends green or red.
- A good check observes external behavior of the pipeline, not its internals. Verify by opening a pull request, and by one deliberate failing change, for example a failing test, to confirm the gate turns red.
- Existing pytest and vitest suites are the prior art and are not extended by this spec.

## Out of Scope

- Deployment to the custom server, networking and certificates.
- Pushing images to any registry.
- Auto-merge.
- Coverage threshold value (decided after the first measurement).

## Further Notes

- Repo is public, so CodeQL and secret scanning are free.
- Pin third-party actions to released versions and let Dependabot update them.
- The pipeline needs no secrets; the OpenAI key is not used in CI.
- Decisions and their history are in `.scratch/ci-pipeline/map.md` and its tickets.
