# 05 — Personal Journal und Stimmungsverlauf

**What to build:** Der Journal Owner kann im Ein-Seiten-Flow seine Daily Snapshots in einer ruhigen Lovable-inspirierten Personal-Journal-Ansicht überblicken, aktuelle Stimmungswerte erkennen und weiterhin einen vollständigen Journal Export herunterladen.

**Blocked by:** 04 — Daily Snapshot im Lovable-Stil.

**Status:** ready-for-agent

- [ ] Das Personal Journal zeigt alle geladenen Daily Snapshots in der vom Backend gelieferten Reihenfolge newest first.
- [ ] Jeder Listeneintrag zeigt mindestens Datum, vorhandene Stimmung und eine kompakte Vorschau der Coach Summary oder Check-in Responses.
- [ ] Ohne Daily Snapshots erscheint ein verständlicher Empty State mit einer passenden Aktion zum Morning Check-in.
- [ ] Ladefehler werden von einem leeren Personal Journal unterschieden und verständlich angezeigt.
- [ ] Ab mindestens zwei gültigen Stimmungswerten erscheint ein kompakter Stimmungsverlauf für höchstens die zehn jüngsten geeigneten Daily Snapshots.
- [ ] Der Stimmungsverlauf wird ausschließlich im Browser aus bereits geladenen Daten berechnet und führt keine Persistenz oder Backend-Analyse ein.
- [ ] Der bestehende JSON Journal Export bleibt erreichbar und zeigt Lade- sowie Fehlerzustände.
- [ ] UI-Tests prüfen newest-first Darstellung, Empty State, Fehler, Stimmungsverlauf und Journal Export.
