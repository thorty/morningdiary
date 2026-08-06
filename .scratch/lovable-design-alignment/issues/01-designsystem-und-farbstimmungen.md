# 01 — Designsystem und Farbstimmungen übernehmen

**What to build:** Das aktuelle Frontend erhält die visuelle Grundlage der Lovable-Vorlage: charakteristische Schriften, semantische Farben, weiche Schatten, große Radien, ruhige Animationen und auswählbare Farbstimmungen. Die gewählte Stimmung bleibt über Seitenaufrufe hinweg erhalten; der automatische Modus orientiert sich an der jüngsten verfügbaren Stimmung im Personal Journal.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Die Oberfläche nutzt Fraunces für Überschriften und Outfit für Fließtext mit belastbaren Fallback-Schriften.
- [ ] Orange, Blau, Lila und Grün sowie ein automatischer Modus können über einen zugänglichen Theme-Picker gewählt werden.
- [ ] Die Auswahl bleibt nach Neuladen und Navigation erhalten; ohne gespeicherte Auswahl wird ein sinnvoller Standard verwendet.
- [ ] Farben, Schatten, Radien, Fokuszustände und Animationen sind zentral über semantische Design-Tokens definiert.
- [ ] Reduzierte Bewegung aus den Systemeinstellungen wird respektiert und automatisierte Tests decken Theme-Auswahl und Persistenz ab.
