# 08 — UI polish

**What to build:** Two small, independent frontend improvements that require no new logic — a heading removal and a layout tightening for HD screens.

The "Optionale Freitext Antwort" heading currently appears above the free-text input on Morning Check-in questions 2–6. It is removed. The input field and any remaining label or placeholder text are sufficient context.

The overall layout is made more compact so that the complete Morning Check-in flow (breathing exercise skipped or completed, each question screen) fits within a standard HD viewport (1920×1080) without the user needing to scroll. This is achieved through CSS adjustments — reducing spacing, padding, and font sizes where the current values push content below the fold. No structural or component changes are expected; only the stylesheet is touched.

No new tests are required for this ticket. The existing test suite must continue to pass.

**Blocked by:** None — can start immediately and run in parallel with any other ticket.

**Status:** ready-for-agent

- [ ] "Optionale Freitext Antwort" heading removed from all free-text Morning Check-in question screens
- [ ] The free-text input remains visible and usable after the heading is removed
- [ ] The full Morning Check-in flow fits within a 1920×1080 viewport without vertical scrolling
- [ ] No existing tests are broken by the layout changes
