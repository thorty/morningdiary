# 01 — Documentation and Manual Migration Runbook

**What to build:** Project and architecture documentation consistently describe the new browser-storage architecture. Also provide a one-time, developer-oriented guide for manually migrating the existing TinyDB JSON file to the browser-storage format implemented in a later ticket.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] The architecture draft, MVP spec, domain glossary, and relevant backend/frontend documentation describe `localStorage` as the source of truth for the Personal Journal.
- [x] Documentation describes the backend as a stateless service for the Health Check and Coach Summary, with a server-side `OPENAI_API_KEY`.
- [x] Outdated statements describing TinyDB as the active journal persistence mechanism are corrected or clearly marked as historical architecture.
- [x] The runbook explains how to back up the existing JSON file, start the application after ticket 02, find the final storage key, and write the converted data to `localStorage` once.
- [x] The runbook converts existing `morning_checkins` records, ignores TinyDB-internal numeric keys, and preserves IDs, dates, status, answers, completion progress, and Coach Summary fields.
- [x] The runbook describes post-migration validation and a safe abort for invalid JSON or incompatible records.
- [x] The documentation explicitly states that migration is a one-time developer task; neither an import UI nor a public migration endpoint is part of the product.
