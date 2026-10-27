# 01 — Dokumentation und manuelles Migrations-Runbook

**What to build:** Die Projekt- und Architektur-Dokumentation beschreibt die neue Browser-Storage-Architektur konsistent. Zusätzlich gibt es eine einmalige, entwicklerorientierte Anleitung, mit der die vorhandene TinyDB-JSON-Datei manuell in das später implementierte Browser-Storage-Format übernommen werden kann.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [x] Architektur-Draft, MVP-Spec, Domain-Kontext und relevante Backend-/Frontend-Dokumentation beschreiben `localStorage` als Quelle des Personal Journals.
- [x] Dokumentation beschreibt das Backend als stateless Service für Health Check und Coach Summary mit serverseitigem `OPENAI_API_KEY`.
- [x] Veraltete Aussagen, nach denen TinyDB die laufende Journal-Persistenz ist, sind korrigiert oder eindeutig als historische Architektur gekennzeichnet.
- [x] Das Runbook erklärt Backup der vorhandenen JSON-Datei, Start der Anwendung nach Ticket 02, Ermittlung des finalen Storage-Keys und einmaliges Schreiben der konvertierten Daten in `localStorage`.
- [x] Das Runbook konvertiert die vorhandenen `morning_checkins`-Records, ignoriert TinyDB-interne numerische Schlüssel und übernimmt IDs, Datum, Status, Antworten, Completion-Fortschritt sowie Coach-Summary-Felder.
- [x] Das Runbook beschreibt eine Validierung nach der Übernahme und einen sicheren Abbruch bei ungültigem JSON oder inkompatiblen Records.
- [x] Es wird ausdrücklich festgehalten, dass die Migration nur für den Entwickler erforderlich ist und weder Import-UI noch öffentlicher Migration-Endpunkt Teil des Produkts sind.
