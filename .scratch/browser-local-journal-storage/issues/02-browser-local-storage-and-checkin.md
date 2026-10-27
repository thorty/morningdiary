# 02 — Browser-local Storage und Morning Check-in

**What to build:** Der Journal Owner kann einen Morning Check-in vollständig browser-lokal durchführen. Antworten werden sofort gespeichert, unfertige Check-ins überleben einen Refresh und werden am selben browser-local calendar day fortgesetzt. Restart, Blank Check-in, tägliche Eindeutigkeit und die Unveränderlichkeit abgeschlossener Daily Snapshots bleiben erhalten.

**Blocked by:** 01 — Dokumentation und manuelles Migrations-Runbook

**Status:** ready-for-agent

- [ ] Ein versioniertes, namespaced Browser-Storage-Dokument kann Morning Check-ins und abgeschlossene Daily Snapshots speichern.
- [ ] Eine testbare Personal-Journal-Store-Seam kapselt Laden, Erstellen, Antworten speichern, Restart, Completion, Finden, Auflisten, Löschen und Exportdaten.
- [ ] UI-Komponenten greifen nicht direkt auf `window.localStorage` zu.
- [ ] Der Store funktioniert ohne Fehler bei Server-Rendering, Modulimport und Tests ohne `window`.
- [ ] Der Store erstellt oder resumed den Check-in anhand des vom Browser gelieferten Datums.
- [ ] Jede Antwort wird unmittelbar persistiert und ein Refresh stellt den aktuellen Fortschritt wieder her.
- [ ] Ein unfertiger Check-in kann neu gestartet werden; ein abgeschlossener Daily Snapshot kann nicht neu gestartet oder überschrieben werden.
- [ ] Ein Blank Check-in kann ohne Backend-Aufruf abgeschlossen werden.
- [ ] Mood-Antworten akzeptieren weiterhin nur `null` oder die Werte 1 bis 5; Fragen 2 bis 6 akzeptieren nur `null` oder Freitext.
- [ ] Pro browser-local calendar day existiert höchstens ein abgeschlossener Daily Snapshot.
- [ ] Der bestehende Morning-Check-in-Journey-Test und Store-Contract-Tests decken Create, Resume, Autosave, Restart, Completion, Immutability und Storage-Fehler ab.
