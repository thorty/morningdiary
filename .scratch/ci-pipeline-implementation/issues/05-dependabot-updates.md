# 05: Configure Dependabot updates

**What to build:** Dependabot regularly opens update pull requests for application dependencies, Docker base images, and GitHub Actions; each pull request is validated by the CI pipeline and remains under human review.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Weekly update pull requests are configured for uv, npm, both Dockerfiles, and GitHub Actions.
- [ ] Dependabot pull requests run through the same applicable CI checks as other pull requests.
- [ ] Auto-merge is not enabled.
