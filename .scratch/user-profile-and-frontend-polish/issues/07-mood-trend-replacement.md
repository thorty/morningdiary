# 07 — Mood Trend replacement

**What to build:** Replace the existing polyline sparkline Mood Trend component on every surface where it appears (Home page and Journal page) with a proper time-series line chart. The new component accepts the same input — an array of Daily Snapshots — so no changes are needed to the pages that render it.

The new chart filters the input to Daily Snapshots from the last 14 calendar days that contain a valid mood value (1–5). Entries outside the 14-day window are silently excluded. If fewer than 2 valid data points remain after filtering, the component renders nothing (preserving the existing minimum-data threshold).

The x-axis shows calendar dates ordered oldest to newest. The tick step starts at one day and widens automatically until tick labels no longer overlap — this is calculated from rendered label widths, not from a fixed data-count threshold. The y-axis shows the five Mood Scale emojis (😞 😐 🙂 😊 😄) as tick labels at levels 1 through 5. A polyline or SVG path connects the data points. The implementation uses inline SVG with no external charting library, consistent with the existing approach.

Component tests assert: emoji tick labels appear on the y-axis; a snapshot dated more than 14 days ago is excluded from the chart; a single valid data point causes the component to render nothing; the correct number of data points are plotted when multiple snapshots fall within the window.

**Blocked by:** 02 — `emojiForMood()` function.

**Status:** ready-for-agent

- [ ] Existing Mood Trend component replaced on the Home page
- [ ] Existing Mood Trend component replaced on the Journal page
- [ ] New chart accepts the same array-of-Daily-Snapshots input as the previous component
- [ ] Only Daily Snapshots from the last 14 calendar days with a valid mood are plotted
- [ ] Snapshots older than 14 days are excluded
- [ ] Fewer than 2 valid data points → component renders nothing
- [ ] X-axis shows calendar dates, oldest to newest
- [ ] X-axis tick step widens when labels would overlap (calculated from rendered widths, not a fixed count)
- [ ] Y-axis shows Mood Scale emojis at all five levels (😞 😐 🙂 😊 😄)
- [ ] Implementation uses inline SVG; no external charting library introduced
- [ ] Component test: all five emoji labels present on the y-axis
- [ ] Component test: snapshot older than 14 days is excluded from the rendered chart
- [ ] Component test: one valid data point → nothing renders
- [ ] Component test: multiple snapshots within the window → correct number of points plotted
