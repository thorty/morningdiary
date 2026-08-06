# 06 — Ein-Seiten-Flow stabilisieren und wiederverwendbar machen

**What to build:** Der Journal Owner erhält einen vollständig stabilen Ein-Seiten-Flow, während dessen bereits funktionierende Ansichten und Verhaltensweisen so abgegrenzt werden, dass sie im anschließenden Mehrseiten-Flow ohne Neuimplementierung wiederverwendet werden können.

**Blocked by:** 05 — Personal Journal und Stimmungsverlauf.

**Status:** ready-for-agent

- [ ] Startansicht, Breathing Exercise, Morning Check-in, Daily Snapshot und Personal Journal funktionieren weiterhin vollständig auf einer Seite.
- [ ] Gemeinsame Darstellung und Morning-Check-in-Steuerung besitzen klare wiederverwendbare Grenzen, ohne API- oder Persistenzlogik zu duplizieren.
- [ ] Der bestehende typed Personal Journal API Client bleibt die einzige Frontend-Grenze zum Backend.
- [ ] Direkte Browseraktualisierung, API-Fehler und ein während der Nutzung fortgesetzter Morning Check-in führen zu verständlichen sichtbaren Zuständen.
- [ ] Die Benutzeroberfläche ist bei repräsentativen Mobile- und Desktop-Breiten sowie per Tastatur bedienbar.
- [ ] Tests prüfen externes Verhalten statt Komponenteninterna oder CSS-Klassen.
- [ ] Frontend-Tests, Typecheck und Produktions-Build laufen erfolgreich durch.
