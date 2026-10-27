# Gratitude Morning Coach — Product Plan

## Product Description

**Summary:**
A guided “Morning Gratitude Coach” web app. Instead of an open-ended chat, the bot takes you through a fixed routine each morning, combining a short breathing exercise, gratitude, and clarity about the day. Everything is saved, and at the end you receive a concise summary of your daily focus.

### Core Features

1. **Guided Morning Routine (Check-in)**
   - A fixed routine with six questions:
    1. Wie geht es dir gerade auf einer Skala von 1 bis 5 – und warum?
    2. Wofür bist du heute dankbar? Nenne drei Dinge.
    3. Welche drei Dinge möchtest du heute unbedingt tun? 
    4. Was wird heute deine „Happy Hour“ – ein besonderer Moment nur für dich?
    5. Was ist dein wichtigstes Ziel für diesen Tag?
    6. Was ist eine Sache, die du heute wirklich beeinflussen kannst?
   - The UI shows exactly **one question** and an input field at a time (text, with an optional rating slider for Q1).

2. **30-Second Breathing Meditation**
   - A 30-second breathing component starts before the check-in:
     - Timer (Ring/Progress-Bar),
     - brief instructions (“Breathe in for 4 seconds, out for 6 seconds…”),
     - Optional short text prompts; audio is not required for v1.
   - After the timer ends, the app automatically moves to question 1.

3. **Gratitude Coach Logic (LLM)**
   - The LLM acts as a “Coach” but is not needed for every question.
   - For v1:
     - At the end, the model generates a short summary containing:
       - Mood (1–5, described in words),
       - Main theme (e.g. focus, rest, uncertainty),
       - A recommendation in 1–2 sentences (e.g. “Focus on … today.”).
   - Potential future extensions:
     - Adapt follow-up questions based on mood,
     - Feedback on recurring patterns.

4. **Daily Summary and Review**
   - After the routine:
     - Display a “Daily Snapshot” with:
       - Date,
       - Mood/score,
       - The three most important extracted to-dos,
       - Happy Hour,
       - “One thing you can control”,
       - An LLM-generated summary in 2–4 sentences.
   - Make snapshots accessible from a history list (“Past entries”).

5. **Browser-Based Journal Storage**
   - The Personal Journal is browser-specific and stored in `localStorage` for the current browser profile.
   - A versioned, namespaced JSON document contains unfinished Morning Check-ins and completed Daily Snapshots. The Personal Journal Store encapsulates access, autosave, resume, completion, export, and deletion; UI components do not access `window.localStorage` directly.
   - The browser-local calendar day determines the check-in. There can be at most one completed Daily Snapshot per day; completed snapshots remain immutable.
   - `localStorage` does not provide synchronization, encryption, or authentication. Switching browsers, devices, or browser profiles does not make the journal available automatically.

6. **Future Integrations**
   - Optional webhooks/events, for example:
     - Trigger in Home Assistant (“Morning Check-in done”),
     - Email/push reminder for the next morning.
   - Not part of v1, but considered in the design.

---

## Project Structure

A monorepo with a frontend (Next.js) and backend (FastAPI).

```text
gratitude-morning-coach/
├── frontend/                # Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Landing page + start button for the routine
│   │   ├── journal/
│   │   │   └── page.tsx     # History view
│   │   └── api/             # (optional) Proxy routes to the backend
│   ├── components/
│   │   ├── BreathTimer.tsx
│   │   ├── QuestionStep.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── SummaryCard.tsx
│   │   └── Layout.tsx
│   ├── lib/
│   │   └── api.ts           # Helper for REST calls to the FastAPI backend
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
│   └── uvicorn_app.py       # e.g. `uv run uvicorn app.main:app --reload`
│
└── README.md                # Project overview and setup
```

---

## Historical API Schema (Before the Browser Migration)

The following `/session` and `/journal` examples describe the former
backend-persisted architecture. They are not current endpoints. The current
backend is stateless and provides only a Health Check and optional Coach
Summary generation; Morning Check-ins, Daily Snapshots, history, and Journal
Export are handled by the browser-local Personal Journal Store.

### 1. `POST /session/start`

**Description:**
Creates a new journaling session for today.

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
  "session_id": "uuid-or-short-id",
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

**Description:**
Saves an answer and returns either the next question or the summary.

**Request (JSON):**
```json
{
  "session_id": "uuid-or-short-id",
  "question_id": "q1",
  "answer": {
    "rating": 3,
    "text": "Feeling a bit tired, but motivated."
  }
}
```

**Response Type A — another question:**
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

**Response Type B — routine complete, summary generated:**
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

The LLM call happens in the backend once the last question (q6) is answered.

### 3. `GET /journal` (History)

**Optional for v1, but easy to include.**

**Query-Parameter:**
- `user_id` (optional)
- `limit`, `offset` (or pagination with `page`)

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

## Historical Architecture: Journal Storage with TinyDB

The following sections document only the original architecture and the format used by existing installations. TinyDB is **no longer** used for active journal persistence. After migration, the backend process has no journal file or journal CRUD endpoint; the Health Check and stateless Coach Summary remain.

The original v1 design used **TinyDB**:

- Pure Python with no server installation,
- Stores data in a JSON file,
- Document-oriented NoSQL,
- Built-in CRUD and query support. [web:98][web:100][web:103]

### Data Model (Conceptual)

**File:** `journal.json` (TinyDB file)

**Document structure for an entry:**

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

### Access in the Historical Backend (FastAPI) — Rough Sketch

```python
# backend/app/db.py
from tinydb import TinyDB, Query

db = TinyDB("journal.json")
JournalEntry = Query()

def create_session(user_id: str | None, date: str) -> str:
    # generate session_id (e.g. uuid4)
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
    # simple filtering with the TinyDB query API
    ...
```

TinyDB was suitable for the small dataset and the original self-hosted architecture. Existing files are not imported automatically. The one-time developer migration is described in `docs/runbooks/tinydb-to-browser-storage.md`.

---

## Next Steps

- Implement the browser-local Personal Journal Store and local Morning Check-in surfaces.
- Run the stateless FastAPI backend with `uv`; keep `OPENAI_API_KEY` exclusively in the backend environment.
- Before upgrading, perform the one-time transfer of existing TinyDB files as described in `docs/runbooks/tinydb-to-browser-storage.md`.

```markdown
```
