# 02 — `emojiForMood()` function

**What to build:** A pure function that maps a mood integer (1–5) to its canonical Mood Scale emoji. This is a prefactor — no UI changes. The function lives in the existing mood utility module and becomes the single source of truth for mood display across all surfaces.

The canonical mapping: 1→😞, 2→😐, 3→🙂, 4→😊, 5→😄.

Unit tests assert the correct emoji is returned for each of the five mood values.

**Blocked by:** None — can start immediately (runs in parallel with ticket 01).

**Status:** ready-for-agent

- [ ] `emojiForMood(mood)` function added to the existing mood utility module
- [ ] Returns 😞 for mood 1
- [ ] Returns 😐 for mood 2
- [ ] Returns 🙂 for mood 3
- [ ] Returns 😊 for mood 4
- [ ] Returns 😄 for mood 5
