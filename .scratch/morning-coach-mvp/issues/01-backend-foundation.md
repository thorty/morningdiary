# 01 — Backend foundation

**What to build:** A runnable FastAPI service for the private Personal Journal, managed with `uv`, with a health check, TinyDB configuration, an API test harness, and the initial contract for retrieving or creating the browser-dated Morning Check-in.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The FastAPI service starts with configuration for persistent TinyDB storage and a health endpoint suitable for local/self-hosted operation.
- [ ] The backend uses `uv` for Python dependency management, locking, test execution, and local service commands.
- [ ] A public API can retrieve or create the unfinished Morning Check-in for a supplied browser-local date without any account or `user_id`.
- [ ] API tests run against isolated temporary storage and cover date validation plus retrieving the same unfinished Morning Check-in twice.
