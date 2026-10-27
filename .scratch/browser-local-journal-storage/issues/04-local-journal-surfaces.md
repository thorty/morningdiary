# 04 — Lokale Personal-Journal-Oberflächen

**What to build:** Home, Personal Journal und Daily Snapshot greifen auf den browser-lokalen Personal-Journal-Store zu. Der Journal Owner kann Historie, Mood Trend, automatische Theme-Auswahl, Snapshot-Details, Journal Export und vollständige lokale Löschung ohne Journal-Backend verwenden.

**Blocked by:** 02 — Browser-local Storage und Morning Check-in

**Status:** ready-for-agent

- [ ] Home lädt den heutigen Check-in und die letzten Daily Snapshots aus dem Browser-Store.
- [ ] Personal Journal zeigt abgeschlossene Daily Snapshots newest first aus derselben Storage-Quelle.
- [ ] Daily Snapshot Detail findet den Snapshot über seine lokale ID ohne Backend-History-Request.
- [ ] Mood Trend verwendet die lokal geladenen Snapshots und behält die bestehenden 14-Tage- und Mood-Scale-Regeln.
- [ ] Automatische Theme-Auswahl verwendet dieselben lokal gespeicherten Snapshots und funktioniert ohne Backend.
- [ ] Journal Export erzeugt einen lossless JSON-Download aus abgeschlossenen lokalen Daily Snapshots.
- [ ] Die Exportaktion funktioniert bei nicht erreichbarem Backend.
- [ ] Die bestehende Löschaktion leert nur das Personal Journal und lässt User Profile, PIN, Security Challenge, Coach-Summary-Einstellung und Theme-Einstellung unverändert.
- [ ] Fehler beim Lesen oder Schreiben von Browser-Storage werden als verständliche UI-Fehler angezeigt.
- [ ] Frontend-Tests prüfen die sichtbare Historie, Detailnavigation, Mood Trend, Theme, Export und Löschung über den bestehenden injizierbaren Client-/Store-Testseam.
