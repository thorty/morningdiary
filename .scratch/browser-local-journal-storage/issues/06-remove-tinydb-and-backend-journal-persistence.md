# 06 — Remove TinyDB and Backend Journal Persistence

**What to build:** After the successful migration and one-time manual data transfer, remove TinyDB completely from the runtime architecture. The backend no longer processes journal data, and the application starts without persistent server storage for the Personal Journal.

**Blocked by:** 02 — Browser-Local Storage and Morning Check-in; 03 — Stateless Coach Summary API; 04 — Local Personal Journal Surfaces; 05 — Coach Summary on the Local Daily Snapshot

**Status:** ready-for-agent

- [ ] TinyDB is no longer a backend runtime or test dependency.
- [ ] Remove backend journal CRUD, history, export, and delete endpoints, along with related persistence models, or adapt them to the stateless contract.
- [ ] Backend configuration contains no TinyDB paths or journal-file settings.
- [ ] Backend startup creates neither `data/`, `personal-journal.json`, nor any other journal file.
- [ ] Backend tests do not import TinyDB and verify only Health Check and stateless Coach Summary behavior.
- [ ] All production frontend defaults use browser storage and no longer call backend journal endpoints.
- [ ] Replace outdated journal API client tests and mock contracts with store and Coach Summary tests.
- [ ] Verify the manual migration guide from ticket 01 against the final storage schema.
- [ ] Full frontend and backend test suites pass.
