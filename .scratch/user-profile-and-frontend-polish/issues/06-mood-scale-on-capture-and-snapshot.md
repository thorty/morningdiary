# 06 — Mood Scale on capture + snapshot display

**What to build:** Replace the current mood representation on the two surfaces that display mood directly — the Morning Check-in mood capture step and the Daily Snapshot display — with the canonical Mood Scale emojis produced by `emojiForMood()`.

On the mood capture step (question 1, Ankommen) the five selectable mood options currently render as Unicode escape sequences or numbers. Each option is updated to display its Mood Scale emoji (😞 😐 🙂 😊 😄) so the user selects a mood by recognising an expressive face rather than interpreting a number.

On the Daily Snapshot display the recorded mood value is rendered using `emojiForMood()` in place of any existing numeric or character-code representation.

The integer stored in the backend and returned by the API is unchanged — only the presentation layer is updated.

Component tests assert: each of the five mood options on the capture step shows the correct emoji; the Daily Snapshot display shows the correct emoji for a given mood value; no Unicode escape sequences or raw numbers appear where an emoji is expected.

**Blocked by:** 02 — `emojiForMood()` function.

**Status:** ready-for-agent

- [ ] Mood capture step renders five selectable options using Mood Scale emojis (😞 😐 🙂 😊 😄)
- [ ] No Unicode escape sequences or raw integers visible on the mood capture step
- [ ] Daily Snapshot display renders the recorded mood using `emojiForMood()`
- [ ] The stored mood integer (1–5) is unchanged — only the display changes
- [ ] Component test: each emoji appears in the correct position on the capture step
- [ ] Component test: Daily Snapshot display shows the correct emoji for each mood value
