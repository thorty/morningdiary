# 03 — Fokussierter Morning Check-in

**What to build:** Der Journal Owner beantwortet die sechs bestehenden deutschen Fragen einzeln in einer fokussierten Kartenansicht. Jede Check-in Response wird über die bestehende API gespeichert, und etablierte Regeln für optionale Antworten, Resume und Restart bleiben erhalten.

**Blocked by:** 02 — Fokussierte Breathing Exercise.

**Status:** ready-for-agent

- [ ] Der Morning Check-in zeigt jeweils genau eine der sechs bestehenden Fragen und eine verständliche Fortschrittsanzeige.
- [ ] Die erste Frage bietet eine zugängliche Stimmungsauswahl von 1 bis 5 mit erkennbarer Beschriftung und Auswahlmarkierung.
- [ ] Die übrigen Fragen bieten jeweils eine optionale freie Texteingabe ohne erzwungene Listenstruktur.
- [ ] Jede Check-in Response wird vor dem Fortschritt über den bestehenden API-Client gespeichert; währenddessen verhindert ein sichtbarer Ladezustand Mehrfachübermittlungen.
- [ ] Speichervalidierung und API-Fehler werden an der aktuellen Frage verständlich angezeigt und können erneut versucht werden.
- [ ] Ein unfertiger Morning Check-in wird an seiner nächsten offenen Frage fortgesetzt.
- [ ] Der Journal Owner kann einen unfertigen Morning Check-in bewusst neu starten; die Aktion bleibt gegenüber dem normalen Fortschritt visuell sekundär.
- [ ] Alle Antworten dürfen leer bleiben, sodass ein Blank Check-in weiterhin möglich ist.
- [ ] Nach Übermittlung der sechsten Check-in Response wird der Morning Check-in über die bestehende API abgeschlossen.
- [ ] UI-Tests prüfen Stimmungsauswahl, Freitext, Blank Check-in, Speichern, Fehler, Resume, Restart und Completion über den gemockten API-Client.
