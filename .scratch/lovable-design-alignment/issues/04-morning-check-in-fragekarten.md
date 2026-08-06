# 04 — Morning Check-in als geführte Fragekarten umsetzen

**What to build:** Der bestehende Morning Check-in führt in der Routine-Ansicht jeweils durch genau eine vorlagengerechte Fragekarte mit Kicker, Fortschrittspunkten, passender Eingabe und klarer Navigation. Die sechs bestehenden Fragen und das Domainmodell bleiben unverändert: Die Stimmung ist eine optionale Bewertung von 1 bis 5, jede weitere Check-in Response bleibt ein einzelner optionaler Freitext.

**Blocked by:** 02 — Startseite nach Vorlagendesign aufbauen; 03 — Breathing Exercise als fokussierte Ansicht gestalten.

**Status:** ready-for-agent

- [ ] Jede der sechs bestehenden Fragen erscheint einzeln mit verständlichem Fortschritt und einer zum Antworttyp passenden Eingabe.
- [ ] Die Stimmungsauswahl verwendet die vorlagengerechten Gesichtssymbole und Labels, bleibt aber fachlich eine einzelne optionale Bewertung von 1 bis 5.
- [ ] Vorwärts- und Rückwärtsnavigation bewahren bereits gespeicherte Antworten; neu übermittelte Antworten werden weiterhin einzeln serverseitig gespeichert.
- [ ] Ein unterbrochener Morning Check-in wird bei der richtigen Frage fortgesetzt und kann weiterhin vollständig neu gestartet werden.
- [ ] Nach der sechsten Check-in Response wird der Morning Check-in wie bisher abgeschlossen; Leerantworten und ein vollständiger Blank Check-in bleiben möglich.
- [ ] Navigation, Speichern, Wiederaufnahme, Neustart und Fehlerfälle sind mit automatisierten Tests abgedeckt.
