# 04 — Local Personal Journal Surfaces

**What to build:** Home, Personal Journal, and Daily Snapshot use the browser-local Personal Journal Store. The Journal Owner can use history, Mood Trend, automatic theme selection, snapshot details, Journal Export, and full local deletion without a journal backend.

**Blocked by:** 02 — Browser-Local Storage and Morning Check-in

**Status:** ready-for-agent

- [ ] Home loads today's check-in and recent Daily Snapshots from the browser store.
- [ ] Personal Journal shows completed Daily Snapshots newest first from the same storage source.
- [ ] Daily Snapshot detail looks up a snapshot by its local ID without a backend history request.
- [ ] Mood Trend uses locally loaded snapshots and preserves the existing 14-day and Mood Scale rules.
- [ ] Automatic theme selection uses the same locally stored snapshots and works without the backend.
- [ ] Journal Export creates a lossless JSON download from completed local Daily Snapshots.
- [ ] Export works when the backend is unreachable.
- [ ] The existing delete action clears only the Personal Journal and leaves the User Profile, PIN, Security Challenge, Coach Summary preference, and theme preference unchanged.
- [ ] Browser-storage read or write errors are shown as understandable UI errors.
- [ ] Frontend tests verify visible history, detail navigation, Mood Trend, theme, export, and deletion through the existing injectable client/store test seam.
