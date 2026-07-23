# 05 — Complete Daily Snapshot without an LLM

**What to build:** A user can complete the six-question Morning Check-in, including a Blank Check-in, and immediately see an immutable Daily Snapshot that preserves its date, mood rating when supplied, and submitted responses. At most one Daily Snapshot can be completed per browser-local day.

**Blocked by:** 04 — Save and resume Morning Check-in responses.

**Status:** ready-for-agent

- [ ] Completing a Morning Check-in persists and displays its Daily Snapshot independently of any Coach Summary generation.
- [ ] A Blank Check-in completes successfully with no Coach Summary and does not invoke a Coach Summary Generator.
- [ ] Once completed, a Daily Snapshot cannot be restarted or changed, and a second completion for the same browser-local date is rejected or returns the existing snapshot.
- [ ] API and UI tests cover normal completion, blank completion, immutable completion, and daily uniqueness.
