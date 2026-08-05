# Gratitude Morning Coach – Design-Referenz

Ziel: eine visuell hochwertige, komplett gestaltete Version aller Screens der App, aus der du Styles und Komponenten in dein bestehendes Next.js-Projekt übernehmen kannst. Fokus liegt auf Design, nicht auf Backend.

Hinweis: Hier läuft React + Tailwind CSS auf TanStack Router (statt Next.js App Router). Die Komponenten, Tailwind-Klassen, Design-Tokens und Animationen sind 1:1 übertragbar – nur die Routing-Dateien unterscheiden sich.

## Design-Richtung
Warm, offen, motivierend, pastellig: Pfirsich/Apricot, weiches Rosé, Sandcreme und ein ruhiger Salbei-Akzent, sanfte Verläufe (Sonnenaufgang), großzügiger Weißraum, große Rundungen, weiche diffuse Schatten, freundliche geometrische Typografie, ruhige Ein-/Ausblend- und Scale-Animationen.

Vor der Umsetzung zeige ich dir drei gerenderte Design-Richtungen in genau diesem Stil (unterschiedliche Komposition, Dichte und Hierarchie) zur Auswahl – dann baue ich die gewählte aus.

## Screens, die gestaltet werden
1. **Start / Begrüßung** – Tageszeit-Gruß, Datum, großer Call-to-Action „Morgen-Routine starten“, Streak-/Stimmungs-Mini-Übersicht, letzte Einträge als Karten.
2. **Atem-Meditation (30 s)** – animierter Atem-Ring mit Progress, Countdown, Hinweistexte („4 Sekunden ein … 6 Sekunden aus“), Überspringen.
3. **Interview** – immer genau eine Frage pro Screen, weicher Übergang zwischen den Fragen, Fortschrittsleiste, Zurück/Weiter:
   - Stimmung 1–5 als gestaltete Skala + „warum?“
   - 3 Dankbarkeits-Felder
   - 3 To-do-Felder
   - Happy Hour
   - wichtigstes Tagesziel
   - „was kann ich heute beeinflussen?“
4. **Daily Snapshot** – Karte mit Datum, Stimmung, To-dos, Happy Hour, „das kann ich beeinflussen“ und Coach-Zusammenfassung; inkl. Lade- und Fehlerzustand im Design.
5. **Rückblick** – Liste vergangener Einträge mit Stimmungsverlauf-Visualisierung, Detailansicht, leerer Zustand.

Alle Screens werden responsive gestaltet (Mobile zuerst, dann Desktop) und in hell/dunkel lesbar.

## Technische Umsetzung
- **Design-System** in `src/styles.css`: Farb-Tokens (Pastellpalette), Gradient-Tokens für Sonnenaufgang-Flächen, weiche Schatten, Radien, Font-Tokens; Web-Fonts über `<link>` im Root-Route-Head. Komponenten nutzen ausschließlich semantische Tokens – keine harten Farbklassen.
- **Komponenten** in `src/components/`: `BreathTimer`, `MoodScale`, `QuestionCard`, `SnapshotCard`, `EntryListItem`, `MoodTrend`, `ProgressDots` – klein, eigenständig, ohne Framework-spezifische Imports, damit du sie direkt kopieren kannst.
- **Routen** (entspricht Next.js-Seiten): `/` (Start), `/routine` (Atem → Fragen → Snapshot als Schrittflow mit lokalem State), `/rueckblick`, `/rueckblick/$id`. Jede Route mit eigenen Meta-Daten.
- **Daten**: Demo-Einträge als lokale Beispieldaten plus optionale Speicherung im Browser (localStorage) über `src/lib/journal.ts`, damit der Flow real durchklickbar ist. Kein Login, keine Datenbank.
- **Coach-Zusammenfassung**: im Design als Textblock mit Lade-/Fehlerzustand; als Platzhalterfunktion in `src/lib/summary.ts`, die du in Next.js gegen deinen eigenen LLM-Aufruf tauschst (Struktur: Stimmung in Worten, Hauptthema, Empfehlung in 1–2 Sätzen). Kein Server-Key nötig.
- **Animationen** mit Tailwind/CSS und Motion-artigen Übergängen, dezent und reduziert (`prefers-reduced-motion` respektiert).

## Übergabe
Am Ende bekommst du eine kurze Liste: welche Datei welche Tokens/Komponenten enthält und was beim Kopieren in Next.js zu beachten ist (Fonts im Layout-Head, Client-Komponenten für Timer/State).
