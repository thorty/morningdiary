# 01 — Implement backend logging

**What to build:** Add terminal-based backend logging that makes the Morning Check-in to Daily Snapshot flow operationally visible with clear `info` and `error` events, including Coach Summary generation and OpenAI request context, while preserving current product behavior.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The backend emits consistent `info` logs for key lifecycle events (service/runtime milestones, Morning Check-in create/resume, completion handling, Coach Summary generation start, generation success, and fallback summary persistence).
- [ ] The backend emits `error` logs for Coach Summary generation failure modes (raised exception and empty/no generated text) with actionable context.
- [ ] Coach Summary/OpenAI logs include only allowed generation context from the current Morning Check-in answers plus relevant identifiers (for example check-in id and target language), and do not include secrets such as API keys or unrelated Personal Journal data.
- [ ] Logging is observational only and does not change API contracts or domain behavior: Daily Snapshot completion remains resilient, Blank Check-ins do not call the generator, and fallback note behavior remains unchanged.
- [ ] Automated backend tests validate required logging behavior in representative scenarios (successful summary generation, generator exception, empty generation output, Blank Check-in completion, and repeated/idempotent completion path) using deterministic fakes and no real OpenAI calls.
