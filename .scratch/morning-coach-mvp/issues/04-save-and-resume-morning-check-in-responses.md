# 04 — Save and resume Morning Check-in responses

**What to build:** A user can progress through the six fixed German questions one at a time, leave every response optional, have each response saved immediately, resume an unfinished Morning Check-in after reopening the app that day, and deliberately restart it before completion.

**Blocked by:** 03 — Start today's Morning Check-in.

**Status:** ready-for-agent

- [ ] The mood question accepts an optional rating from 1 through 5, and each remaining question accepts one optional free-text response.
- [ ] Submitting a response saves it through the API and advances to the next question; malformed ratings and unknown check-in state return meaningful client-visible failures.
- [ ] Reopening the same day restores saved responses and the appropriate next question; restart clears only an unfinished Morning Check-in.
- [ ] API and UI tests cover optional answers, autosave/resume, invalid mood values, and restart behavior.
