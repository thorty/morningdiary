# 03 — Stateless Coach Summary API

**What to build:** Das Backend bietet eine schlanke, stateless Schnittstelle für die optionale Coach Summary. Es speichert keine Check-ins oder Journal-Daten. Die API verarbeitet ausschließlich die aktuellen Antworten und die Zielsprache; der OpenAI-Schlüssel bleibt ausschließlich in der Backend-Umgebung.

**Blocked by:** 01 — Dokumentation und manuelles Migrations-Runbook

**Status:** ready-for-agent

- [ ] Es gibt einen klaren HTTP-Vertrag für die Coach-Summary-Erzeugung mit aktuellen Antworten und Zielsprache als einzigem fachlichem Input.
- [ ] Der Backend-Prozess erstellt beim Start keine TinyDB und keine Journal-Datei.
- [ ] `OPENAI_API_KEY` wird ausschließlich aus der Backend-Umgebung geladen und niemals in Client-Konfiguration, Response-Daten oder Browser-Storage ausgegeben.
- [ ] Der Backend-Vertrag gibt erfolgreichen Summary-Text sowie kontrollierte unavailable-/leere-Ergebnisse zurück.
- [ ] Die bestehende Sprachdetektion und die unterstützende, nicht-klinische Summary-Regel bleiben erhalten.
- [ ] Requests enthalten weder Personal-Journal-Historie noch User Profile, PIN, Security Challenge oder Benutzeridentität.
- [ ] Health Check und CORS-Verhalten für den Frontend-Zugriff bleiben funktionsfähig.
- [ ] Backend-Tests prüfen den HTTP-Vertrag, Key-Konfiguration, Input-Validierung, Sprachübergabe und kontrollierte Generatorfehler mit Fake-Generatoren ohne OpenAI-Aufruf.
