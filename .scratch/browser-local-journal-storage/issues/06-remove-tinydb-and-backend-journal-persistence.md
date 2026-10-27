# 06 — TinyDB entfernen und Backend-Journal-Persistenz bereinigen

**What to build:** Nach erfolgreicher Umstellung und einmaliger manueller Datenübernahme ist TinyDB vollständig aus der Laufzeitarchitektur entfernt. Das Backend verarbeitet keine Journal-Daten mehr, und die Anwendung startet ohne persistenten Server-Datenträger für das Personal Journal.

**Blocked by:** 02 — Browser-local Storage und Morning Check-in; 03 — Stateless Coach Summary API; 04 — Lokale Personal-Journal-Oberflächen; 05 — Coach Summary am lokalen Daily Snapshot

**Status:** ready-for-agent

- [ ] TinyDB ist keine Runtime- oder Testabhängigkeit des Backends mehr.
- [ ] Backend-Journal-CRUD, History, Export und Delete-Endpunkte sowie zugehörige Persistenzmodelle sind entfernt oder auf den stateless Vertrag umgestellt.
- [ ] Backend-Konfiguration enthält keine TinyDB-Pfade oder Journal-Datei-Einstellungen mehr.
- [ ] Backend-Start erzeugt weder `data/` noch `personal-journal.json` oder eine andere Journal-Datei.
- [ ] Backend-Tests verwenden keinen TinyDB-Import und prüfen nur noch Health Check und stateless Coach Summary-Verhalten.
- [ ] Frontend verwendet in allen produktiven Defaults Browser-Storage und ruft keine Backend-Journal-Endpunkte mehr auf.
- [ ] Veraltete Journal-API-Client-Tests und Mock-Verträge sind durch Store- und Coach-Summary-Tests ersetzt.
- [ ] Die manuelle Migrationsanleitung aus Ticket 01 wurde gegen das finale Storage-Schema geprüft.
- [ ] Vollständige Frontend- und Backend-Testläufe bestehen.
