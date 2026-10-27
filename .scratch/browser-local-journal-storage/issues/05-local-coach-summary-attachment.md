# 05 — Coach Summary am lokalen Daily Snapshot

**What to build:** After local completion, a Daily Snapshot can optionally receive a Coach Summary. The frontend store persists success, unavailable status, and retry state locally. A stateless backend failure must not lose the completion or its answers.

**Blocked by:** 02 — Browser-Local Storage and Morning Check-in; 03 — Stateless Coach Summary API

**Status:** ready-for-agent

- [ ] A non-empty Morning Check-in is completed locally before starting the Coach Summary request.
- [ ] On successful generation, the text is saved to the existing local Daily Snapshot.
- [ ] When Coach Summary generation is disabled, save `not_requested` locally and do not make a backend request.
- [ ] A Blank Check-in makes no backend request and generates no Coach Summary.
- [ ] On timeout, exception, unavailable response, or empty text, preserve the complete Daily Snapshot and attach the existing German unavailable note.
- [ ] A failed summary attempt marks the local snapshot as retryable when domain requirements allow it.
- [ ] A retry updates only the existing Daily Snapshot and does not create a second snapshot for the same day.
- [ ] Preserve the current language detection and German fallback for mixed-language answers.
- [ ] Frontend tests verify success, opt-out, Blank Check-in, unavailable status, errors, retry, and request content without journal history.
