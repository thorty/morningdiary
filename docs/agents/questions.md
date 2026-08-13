# Situration

- Prototyp ist fertig
- Fullstack App:
    - frontend: next.js + p5.js
    - backend: python
    - services: openai as llm services für generativen content
- Läuft lokal

# Ziel

## MVP
- App soll in der cloud laufen / als webapp für mobile und andere devices erreichbar sein.
- Die app soll von mehrere Personen auf demselben Gerät/Browser genutzt werden können aber mit den eigenen Daten.
- Datenhaltung lokal. Der Nutzer besitzt die Daten selbst. (nicht serverseitig)
- Das LLM Feature (zusammenfassung) soll ein und ausgeschaltet werden können
- So viel Code wie möglich soll im Browser laufen


## Bedinungen
- Architektur und Domainentscheidungen dürfen geändert werdem.

## Fragestellung
- Kann die App komplett im browser laufen inklusive OpenAI Key?
- Wenn nicht: Wie kann die OpenAI Anbindung sicher und leichtgewichtig implementiert werden
- Welche alternativen gibt es?
- Wie kann ein lichtgewichtiger nutzerlogin erfolgen (pin oder ähnlich für multiuser lokal)
- Wenn die App einer Nutzergruppe angeboten wird: was muss rechtlich alles geklärt und inhalt sein innerhalb der EU