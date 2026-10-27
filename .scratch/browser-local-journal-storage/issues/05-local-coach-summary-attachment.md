# 05 — Coach Summary am lokalen Daily Snapshot

**What to build:** Nach der lokalen Completion erhält ein Daily Snapshot optional eine Coach Summary. Der Frontend-Store speichert Erfolg, unavailable-Status und Retry-Zustand lokal. Ein Fehler beim stateless Backend verliert weder Completion noch Antworten.

**Blocked by:** 02 — Browser-local Storage und Morning Check-in; 03 — Stateless Coach Summary API

**Status:** ready-for-agent

- [ ] Ein nicht-leerer Morning Check-in wird lokal abgeschlossen, bevor die Coach-Summary-Anfrage gestartet wird.
- [ ] Bei erfolgreicher Generierung wird der Text am bestehenden lokalen Daily Snapshot gespeichert.
- [ ] Bei deaktivierter Coach Summary wird lokal `not_requested` gespeichert und kein Backend-Aufruf ausgeführt.
- [ ] Ein Blank Check-in erzeugt keinen Backend-Aufruf und keine Coach Summary.
- [ ] Bei Timeout, Exception, unavailable-Response oder leerem Text bleibt der Daily Snapshot vollständig erhalten und erhält die bestehende deutsche unavailable-Notiz.
- [ ] Ein fehlgeschlagener Summary-Versuch markiert den lokalen Snapshot als retrybar, sofern die fachlichen Voraussetzungen erfüllt sind.
- [ ] Ein Retry aktualisiert nur den bestehenden Daily Snapshot und erzeugt keinen zweiten Snapshot für denselben Tag.
- [ ] Die aktuelle Sprachdetektion und der Fallback auf Deutsch bei gemischten Antworten bleiben sichtbar korrekt.
- [ ] Frontend-Tests prüfen Success, Opt-out, Blank Check-in, unavailable, Fehler, Retry und den Request-Inhalt ohne Journal-Historie.
