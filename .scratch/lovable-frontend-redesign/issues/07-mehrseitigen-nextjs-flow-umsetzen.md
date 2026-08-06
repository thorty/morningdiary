# 07 — Mehrseitigen Next.js-Flow umsetzen

**What to build:** Der Journal Owner nutzt die stabilisierten Ansichten als zusammenhängenden mehrseitigen Next.js-Flow mit eigener Startseite, Morning-Check-in-Seite, Personal Journal und Daily-Snapshot-Detailansicht. Direkte URLs rekonstruieren ihren Zustand aus der bestehenden FastAPI-API.

**Blocked by:** 06 — Ein-Seiten-Flow stabilisieren und wiederverwendbar machen.

**Status:** ready-for-agent

- [ ] Die Startseite zeigt das browserlokale Datum, den heutigen Status, eine passende Start- oder Resume-Aktion, jüngste Daily Snapshots und Navigation zum Personal Journal.
- [ ] Die Morning-Check-in-Seite lädt oder erstellt den heutigen Morning Check-in bei direktem Aufruf und führt durch Breathing Exercise, Fragen und Daily Snapshot.
- [ ] Ein unfertiger Morning Check-in wird bei direktem Aufruf fortgesetzt; ein bereits abgeschlossener Tag zeigt seinen unveränderlichen Daily Snapshot.
- [ ] Die Personal-Journal-Seite zeigt alle Daily Snapshots newest first, Stimmungsverlauf, Empty/Error States und Journal Export.
- [ ] Jeder Daily Snapshot kann über eine eigene Detail-URL geöffnet werden; die Ansicht wird aus dem vorhandenen Listen-Endpunkt aufgelöst.
- [ ] Eine unbekannte Daily-Snapshot-ID zeigt einen verständlichen Not-found-Zustand statt eines technischen Fehlers.
- [ ] Startseite, Morning Check-in, Personal Journal und Detailansicht bieten eindeutige Navigation untereinander.
- [ ] Die Mehrseiten-Umsetzung verwendet die stabilisierten Komponenten und Steuerungsgrenzen wieder und führt keine zweite Implementierung oder Browser-Persistenz der Journaldaten ein.
- [ ] Navigation und Direktaufrufe funktionieren bei Mobile- und Desktop-Breiten, per Tastatur und mit `prefers-reduced-motion`.
- [ ] UI-Tests prüfen Navigation, Direktaufruf, Resume, Completion, Personal Journal, Detailauflösung und Not-found-Zustand über gemockte API-Antworten.
- [ ] Frontend-Tests, Typecheck und Produktions-Build laufen erfolgreich durch.
