# 01 — Lovable-Startansicht im Ein-Seiten-Flow

**What to build:** Der Journal Owner erhält im bestehenden Next.js-Ein-Seiten-Flow eine ruhige, responsive Startansicht nach der Lovable-Designvorlage. Sie vermittelt den heutigen Status des Morning Check-in und bietet einen klaren Einstieg, ohne bestehende API- oder Datenschutzgrenzen zu verändern.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Die Startansicht verwendet eine konsistente warme Designsprache mit semantischen Farben, Typografie, Abständen, Rundungen, Schatten und sichtbaren Fokuszuständen.
- [ ] Die Startansicht zeigt das browserlokale Datum, eine passende deutsche Begrüßung und eine kurze Erklärung des Morning Check-in.
- [ ] Eine klar erkennbare Aktion startet den Morning Check-in über den bestehenden API-Client.
- [ ] Datenschutzhinweis und Backend-Status bleiben verständlich sichtbar, dominieren die Startansicht aber nicht.
- [ ] Fehler beim Starten werden als verständliche deutsche Meldung angezeigt und verhindern keine erneute Ausführung.
- [ ] Die Ansicht funktioniert bei repräsentativen Mobile- und Desktop-Breiten und respektiert `prefers-reduced-motion`.
- [ ] UI-Tests prüfen das sichtbare Startverhalten über den gemockten Personal Journal API Client.
