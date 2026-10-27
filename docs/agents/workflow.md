# Feature-Workflow mit Matt-Pocock-Skills

Dieser Leitfaden beschreibt den Main Flow für Änderungen an Morningcoach. Die Skills unterstützen den Ablauf; sie ersetzen weder die Entscheidungen des Maintainers noch die Repo-Konventionen.

## Main Flow: Idee bis Umsetzung

### 1. Repo-Kontext aufnehmen

Vor einer Änderung:

- `CONTEXT.md` und die für das Thema relevanten ADRs in `docs/adr/` lesen.
- Den aktuellen Code und vorhandene Tests erkunden, bevor eine Lösung festgelegt wird.
- Die Begriffe aus `CONTEXT.md` verwenden. `docs/agents/domain.md` beschreibt, wie die Domain-Dokumente zu verwenden sind.

### 2. Idee schärfen — `/grill-with-docs`

Für neue Features oder größere Änderungen zuerst `/grill-with-docs` verwenden. Der Skill führt durch die offenen Produkt- und Designfragen und hält geklärte Begriffe bzw. Entscheidungen in den Domain-Dokumenten fest.

Für eine konkrete Verhaltens- oder UI-Frage kann `/prototype` helfen, bevor die Lösung spezifiziert wird. Bei Vorhaben, deren offene Entscheidungen nicht in eine Sitzung passen, zuerst mit `/wayfinder` eine Map und Entscheidungstickets anlegen. Das lokale Map- und Ticketformat ist in `docs/agents/issue-tracker.md` beschrieben.

### 3. Abgestimmte Diskussion in eine Spec überführen — `/to-spec`

`/to-spec` fasst die bereits geführte Diskussion zusammen; es ist kein Ersatz für die Klärung offener Fragen. Der Skill prüft den Codebase-Kontext, schlägt Test-Seams vor und fragt nach deren Bestätigung.

Die Spec wird unter `.scratch/<feature-slug>/spec.md` angelegt. Sie beschreibt Problem, Lösung, User Stories, Implementierungs- und Testentscheidungen sowie den Out-of-Scope. Die Spec erhält den Status `ready-for-agent`, wenn sie zur Aufteilung bereit ist.

### 4. Spec in umsetzbare Tickets aufteilen — `/to-tickets`

`/to-tickets` zerlegt die abgestimmte Spec in kleine, vollständige und einzeln überprüfbare Umsetzungsscheiben. Erst Granularität und Abhängigkeiten gemeinsam prüfen und freigeben, dann veröffentlichen.

Für den lokalen Markdown-Tracker gilt:

- Pro Ticket eine Datei unter `.scratch/<feature-slug>/issues/`, beginnend mit `01-`.
- Abhängigkeiten als `Blocked by` aufführen; Tickets ohne echte Voraussetzung bleiben unabhängig.
- Für den Status die Repo-Konventionen aus `docs/agents/triage-labels.md` verwenden.
- Das vollständige Dateiformat und die weiteren Tracker-Regeln stehen in `docs/agents/issue-tracker.md`.

### 5. Tickets einzeln umsetzen — `/implement`

Ein Ticket anhand seiner Datei referenzieren, zum Beispiel `/implement .scratch/<feature-slug>/issues/01-<slug>.md`. In Abhängigkeitsreihenfolge arbeiten: jeweils nur an Tickets weiterarbeiten, deren Blocker erledigt sind.

Die Umsetzung erfolgt in kleinen vertikalen Scheiben mit Tests an den vereinbarten öffentlichen Seams. Bei testgetriebener Arbeit gelten die Red-Green-Regeln aus `/tdd`. Vor dem Abschluss die passenden Tests und Typprüfungen ausführen und die Änderung gegen Ticket und Spec prüfen.

**Commit beachten:** Die installierte `/implement`-Skill-Anleitung fordert einen Commit auf dem aktuellen Branch. Vor dem Aufruf deshalb festlegen, ob ein Commit gewünscht ist und ob zusätzliche Branch-Vorgaben gelten.

### 6. Änderung überprüfen — `/code-review`

Nach der Umsetzung `/code-review` gegen einen ausdrücklich festgelegten Vergleichspunkt ausführen, typischerweise den Basisbranch. Die Prüfung betrachtet Repo-Standards und Spec-Erfüllung getrennt. Bei Findings erst entscheiden und nötige Korrekturen umsetzen, bevor die Änderung als fertig gilt.

## Nebenpfade

- **Bug oder unerwartetes Verhalten:** mit `/diagnosing-bugs` Ursache und Reproduktion ermitteln; bei größerem Umfang anschließend Spec und Tickets anlegen.
- **Backlog sichten:** `/triage` verwenden. Die fünf Statusrollen sind in `docs/agents/triage-labels.md` auf die Repo-Bezeichnungen abgebildet.
- **Architektur- oder Begriffsarbeit:** `/domain-modeling` nutzen; wesentliche Architekturentscheidungen in `docs/adr/` festhalten.
- **Kleine, klar begrenzte Änderung:** den vollständigen Flow nicht künstlich durchlaufen. Kontext prüfen, Umfang abgleichen, gezielt umsetzen und passend testen.

## Ablage und Sichtbarkeit

Specs, Umsetzungstickets und Wayfinder-Artefakte gehören nach `.scratch/`. Ob diese Dateien im Git-Repository geteilt werden, hängt davon ab, ob `.scratch/` im jeweiligen Arbeitsstand von Git ignoriert wird. Vor dem Verlassen oder Wechseln des Branches prüfen, ob wichtige lokale Tracker-Artefakte versioniert oder anderweitig gesichert sind.

Die Skills selbst können benutzerspezifisch installiert sein. Dieser Leitfaden dokumentiert den Ablauf, installiert oder aktualisiert aber keine Skills. Verfügbarkeit und Version der Skills bei anderen Mitwirkenden separat sicherstellen.
