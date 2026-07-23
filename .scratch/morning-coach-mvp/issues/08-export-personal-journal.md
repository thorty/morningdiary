# 08 — Export Personal Journal

**What to build:** A user can download a Journal Export: a lossless JSON backup containing every retained Daily Snapshot, its answers, and any Coach Summary.

**Blocked by:** 05 — Complete Daily Snapshot without an LLM.

**Status:** ready-for-agent

- [ ] A backend export operation returns every retained Daily Snapshot and preserves all stored response and Coach Summary data in JSON.
- [ ] The Personal Journal view provides a German action that downloads the JSON as a file.
- [ ] The export is available whether or not individual snapshots have Coach Summaries.
- [ ] API and UI tests verify the export content and download behavior.
