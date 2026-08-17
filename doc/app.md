# Gratitude Morning Coach – Bauplan

## Produktbeschreibung

**Kurzidee:**  
Ein geführter „Morning Gratitude Coach“ als Web-App. Statt freiem Chat führt dich der Bot jeden Morgen durch eine feste Routine, kombiniert mit einer kurzen Atemübung, Dankbarkeit und Klarheit über den Tag. Alles wird gespeichert und am Ende bekommst du eine kompakte Zusammenfassung deines Tagesfokus.

### Kernfunktionen

1. **Geführte Morgen-Routine (Interview)**
   - Fester Flow mit 6 Fragen:
    1. Wie geht es dir gerade auf einer Skala von 1 bis 5 – und warum?
    2. Wofür bist du heute dankbar? Nenne drei Dinge.
    3. Welche drei Dinge möchtest du heute unbedingt tun? 
    4. Was wird heute deine „Happy Hour“ – ein besonderer Moment nur für dich?
    5. Was ist dein wichtigstes Ziel für diesen Tag?
    6. Was ist eine Sache, die du heute wirklich beeinflussen kannst?
   - UI zeigt immer genau **eine Frage** + Eingabefeld (Text, ggf. Rating-Slider bei Q1).

2. **30-Sekunden Atem-Meditation**
   - Vor dem Interview startet eine 30s-Breath-Komponente:
     - Timer (Ring/Progress-Bar),
     - kurze Anweisungen („4 Sekunden ein, 6 Sekunden aus …“),
     - optional kurze Text-Hints, kein Audio nötig für v1.
   - Nach Ablauf geht es automatisch zu Frage 1.

3. **Gratitude-Chatbot-Logik (LLM)**
   - LLM läuft als „Coach“, wird aber nicht für jede Frage gebraucht.
   - Einsatz v1:
     - Am Ende generiert das Modell eine Kurz-Zusammenfassung:
       - Stimmung (1–5, verbalisierter Eindruck),
       - Hauptthema (z.B. Fokus, Erholung, Unsicherheit),
       - Empfehlung in 1–2 Sätzen (z.B. „Konzentriere dich heute auf …“).
   - Später erweiterbar:
     - Anpassung der Folgefragen je nach Stimmung,
     - Feedback bei wiederkehrenden Mustern.

4. **Tages-Summary & Rückblick**
   - Nach dem Flow:
     - Anzeige eines „Daily Snapshot“:
       - Datum,
       - Stimmung/Score,
       - extrahierte 3 wichtigsten To-dos,
       - Happy Hour,
       - „One thing you can control“,
       - LLM-Zusammenfassung in 2–4 Sätzen.
   - In einer History-Liste aufrufbar („Vergangene Einträge“).

5. **Journal-Speicherung im Browser**
   - Das Personal Journal ist browsergebunden und wird im `localStorage` des aktuellen Browser-Profils gespeichert.
   - Ein versioniertes, namespaced JSON-Dokument enthält laufende Morning Check-ins und abgeschlossene Daily Snapshots. Der Personal Journal Store kapselt Zugriff, Autosave, Resume, Completion, Export und Löschung; UI-Komponenten greifen nicht direkt auf `window.localStorage` zu.
   - Der Browser-local calendar day bestimmt den Check-in. Pro Tag gibt es höchstens einen abgeschlossenen Daily Snapshot; abgeschlossene Snapshots bleiben unveränderlich.
   - `localStorage` ist keine Synchronisierung, Verschlüsselung oder Authentifizierung. Ein Wechsel von Browser, Gerät oder Browser-Profil stellt das Journal nicht automatisch bereit.

6. **Später: Integrationen**
   - Optionale Webhooks/Events, z.B.:
     - Trigger an Home Assistant („Morning Check-in done“),
     - E-Mail/Push-Reminder für den nächsten Morgen.
   - Nicht Teil von v1, aber im Design berücksichtigt.

---

## Projektstruktur

Monorepo mit Frontend (Next.js) und Backend (FastAPI).

```text
gratitude-morning-coach/
├── frontend/                # Next.js App
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Landing + Start-Button für Routine
│   │   ├── journal/
│   │   │   └── page.tsx     # History-Ansicht
│   │   └── api/             # (optional) Proxy-Routen zum Backend
│   ├── components/
│   │   ├── BreathTimer.tsx
│   │   ├── QuestionStep.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── SummaryCard.tsx
│   │   └── Layout.tsx
│   ├── lib/
│   │   └── api.ts           # Helper für REST-Calls zum FastAPI-Backend
│   ├── styles/
│   │   └── globals.css
│   ├── next.config.mjs
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                 # Stateless FastAPI App, managed with uv
│   ├── app/
│   │   ├── main.py          # FastAPI entrypoint
│   │   ├── config.py        # Backend settings and OPENAI_API_KEY
│   │   ├── models.py        # Coach Summary request/response models
│   │   └── coach_summary.py # Replaceable server-side generator
│   ├── pyproject.toml       # Python dependencies managed and locked by uv
│   ├── uv.lock
│   └── uvicorn_app.py       # z.B. `uv run uvicorn app.main:app --reload`
│
└── README.md                # Projektbeschreibung & Setup
```

---

## Historisches API-Schema (vor der Browser-Migration)

Die folgenden `/session`- und `/journal`-Beispiele beschreiben die frühere,
backend-persistierte Architektur. Sie sind keine aktuellen Endpunkte. Das
heutige Backend ist stateless und bietet nur Health Check und die optionale
Coach-Summary-Erzeugung; Morning Check-ins, Daily Snapshots, History und
Journal Export liegen im browser-local Personal Journal Store.

### 1. `POST /session/start`

**Beschreibung:**  
Erzeugt eine neue Journaling-Session für heute.

**Request (JSON):**
```json
{
  "user_id": "optional-user-id-or-null",
  "date": "2026-07-22"
}
```

**Response (JSON):**
```json
{
  "session_id": "uuid-oder-kurzid",
  "breath_instructions": "Breathe in for 4 seconds, out for 6 seconds...",
  "breath_duration_seconds": 30,
  "first_question": {
    "id": "q1",
    "text": "How are you feeling from 1 to 5, and why?",
    "type": "rating_with_text"
  }
}
```

### 2. `POST /session/answer`

**Beschreibung:**  
Speichert eine Antwort und gibt entweder die nächste Frage oder das Summary zurück.

**Request (JSON):**
```json
{
  "session_id": "uuid-oder-kurzid",
  "question_id": "q1",
  "answer": {
    "rating": 3,
    "text": "Feeling a bit tired, but motivated."
  }
}
```

**Antwort-Typ A – weitere Frage:**
```json
{
  "status": "next_question",
  "next_question": {
    "id": "q2",
    "text": "What are three things you’re grateful for?",
    "type": "text_multiline"
  }
}
```

**Antwort-Typ B – Flow fertig, Summary erzeugt:**
```json
{
  "status": "completed",
  "summary": {
    "date": "2026-07-22",
    "mood_score": 3,
    "happy_hour": "Evening walk with my dog",
    "daily_goal": "Finish feature X without rushing",
    "control_point": "Focus on my next task, not the whole backlog",
    "summary_text": "You start the day a bit tired but motivated. Your focus is on making progress without overwhelming yourself. Remember that your main win today is staying calm and present while working on the next step."
  }
}
```

Der LLM-Call passiert im Backend, sobald die letzte Frage (q6) beantwortet ist.

### 3. `GET /journal` (History)

**Optional für v1, aber leicht mitzunehmen.**

**Query-Parameter:**
- `user_id` (optional)
- `limit`, `offset` (oder Paging mit `page`)

**Response (JSON):**
```json
{
  "entries": [
    {
      "session_id": "abc123",
      "date": "2026-07-21",
      "mood_score": 4,
      "happy_hour": "Coffee with friend",
      "daily_goal": "Ship small improvement",
      "summary_text": "You felt fairly positive yesterday and focused on small wins.",
      "created_at": "2026-07-21T06:15:00Z"
    },
    {
      "session_id": "def456",
      "date": "2026-07-20",
      "mood_score": 2,
      "happy_hour": "Reading in the evening",
      "daily_goal": "Just get through the meetings",
      "summary_text": "Yesterday was heavy, but you still created space for a quiet evening.",
      "created_at": "2026-07-20T06:12:00Z"
    }
  ]
}
```

---

## Historische Architektur: Journal-Speicher mit TinyDB

Die folgenden Abschnitte dokumentieren ausschließlich die ursprüngliche Architektur und das Format bestehender Installationen. TinyDB ist **nicht** mehr die laufende Journal-Persistenz. Nach der Umstellung besitzt der Backend-Prozess keine Journal-Datei und keinen Journal-CRUD-Endpunkt mehr; Health Check und stateless Coach Summary bleiben erhalten.

Für die ursprüngliche v1 war **TinyDB** vorgesehen:

- reines Python, keine Server-Installation,
- speichert als JSON-Datei,
- dokument-orientiertes NoSQL,
- CRUD + Query-Unterstützung out-of-the-box. [web:98][web:100][web:103]

### Datenmodell (Konzeptuell)

**Datei:** `journal.json` (TinyDB-Datei)

**Dokumentstruktur für einen Eintrag:**

```json
{
  "session_id": "abc123",
  "user_id": "optional",
  "date": "2026-07-22",
  "answers": {
    "q1": { "rating": 3, "text": "Feeling a bit tired, but motivated." },
    "q2": { "text": ["my dog", "morning coffee", "having a job I like"] },
    "q3": { "text": ["ship feature X", "go for a walk", "cook a healthy dinner"] },
    "q4": { "text": "Evening walk with my dog" },
    "q5": { "text": "Stay calm and do focused deep work blocks" },
    "q6": { "text": "I can control my next action, not the whole backlog." }
  },
  "mood_score": 3,
  "happy_hour": "Evening walk with my dog",
  "daily_goal": "Stay calm and do focused deep work blocks",
  "control_point": "I can control my next action, not the whole backlog.",
  "summary_text": "You start the day a bit tired but motivated...",
  "created_at": "2026-07-22T06:10:00Z"
}
```

### Zugriff im historischen Backend (FastAPI) – grobe Skizze

```python
# backend/app/db.py
from tinydb import TinyDB, Query

db = TinyDB("journal.json")
JournalEntry = Query()

def create_session(user_id: str | None, date: str) -> str:
    # generate session_id (z.B. uuid4)
    ...

def save_answer(session_id: str, question_id: str, answer: dict) -> None:
    db.update(
        lambda doc: doc["answers"].update({question_id: answer}),
        JournalEntry.session_id == session_id
    )

def finalize_session(session_id: str, mood_score: int, happy_hour: str,
                     daily_goal: str, control_point: str, summary_text: str) -> None:
    db.update(
        {
            "mood_score": mood_score,
            "happy_hour": happy_hour,
            "daily_goal": daily_goal,
            "control_point": control_point,
            "summary_text": summary_text
        },
        JournalEntry.session_id == session_id
    )

def get_entries(user_id: str | None = None, limit: int = 20, offset: int = 0):
    # einfache Filterung mit TinyDB-Query API
    ...
```

TinyDB war für den kleinen Datensatz und die ursprüngliche selbst gehostete Architektur geeignet. Bestehende Dateien werden nicht automatisch importiert. Die einmalige Entwickler-Migration ist in `docs/runbooks/tinydb-to-browser-storage.md` beschrieben.

---

## Next Steps

- Browser-local Personal Journal Store und lokale Morning-Check-in-Oberflächen implementieren.
- Das stateless FastAPI-Backend mit `uv` starten; `OPENAI_API_KEY` bleibt ausschließlich in der Backend-Umgebung.
- Die einmalige Übernahme bestehender TinyDB-Dateien vor dem Upgrade gemäß `docs/runbooks/tinydb-to-browser-storage.md` durchführen.

```markdown
```
