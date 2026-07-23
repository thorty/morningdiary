# 03 — Start today's Morning Check-in

**What to build:** A user can open the app, see the German disclosure that current answers may be sent to OpenAI for an optional Coach Summary, retrieve or create today’s browser-dated Morning Check-in, and skip or finish the 30-second Breathing Exercise to reach the first question.

**Blocked by:** 01 — Backend foundation; 02 — Frontend foundation.

**Status:** ready-for-agent

- [ ] The browser supplies its local calendar date and the backend retrieves or creates only that day’s unfinished Morning Check-in.
- [ ] The German start experience discloses the current-answer-only OpenAI boundary before the routine begins.
- [ ] The visual Breathing Exercise shows the fixed German four-seconds-in/six-seconds-out cue, lasts 30 seconds, is skippable, is not persisted, and reaches question one when finished or skipped.
- [ ] API and UI tests cover daily check-in retrieval plus both Breathing Exercise paths.
