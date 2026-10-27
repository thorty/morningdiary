# 02 — Browser-Local Storage and Morning Check-in

**What to build:** The Journal Owner can complete a Morning Check-in entirely in browser-local storage. Answers are saved immediately, unfinished check-ins survive a page refresh, and the check-in resumes on the same browser-local calendar day. Restart, Blank Check-in, daily uniqueness, and the immutability of completed Daily Snapshots are preserved.

**Blocked by:** 01 — Documentation and Manual Migration Runbook

**Status:** ready-for-agent

- [ ] A versioned, namespaced browser-storage document can store Morning Check-ins and completed Daily Snapshots.
- [ ] A testable Personal Journal Store seam encapsulates loading, creation, saving answers, restart, completion, lookup, listing, deletion, and export data.
- [ ] UI components do not access `window.localStorage` directly.
- [ ] The store works without errors during server rendering, module import, and tests without `window`.
- [ ] The store creates or resumes a check-in based on the date supplied by the browser.
- [ ] Each answer is persisted immediately, and a refresh restores the current progress.
- [ ] An unfinished check-in can be restarted; a completed Daily Snapshot cannot be restarted or overwritten.
- [ ] A Blank Check-in can be completed without a backend request.
- [ ] Mood answers continue to accept only `null` or values 1 through 5; questions 2 through 6 accept only `null` or free text.
- [ ] At most one completed Daily Snapshot exists for each browser-local calendar day.
- [ ] The existing Morning Check-in journey test and store contract tests cover creation, resume, autosave, restart, completion, immutability, and storage errors.
