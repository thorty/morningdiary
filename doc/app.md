# Gratitude Morning Coach — Product Plan

## Product Description

**Summary:**
A guided “Morning Gratitude Coach” web app. Instead of an open-ended chat, the app takes a person through a fixed routine each morning, combining a short breathing exercise, gratitude, and clarity about the day. The check-in is saved in the current browser profile, and the person can receive an optional coach reflection.

### Core Features

1. **Guided Morning Routine (Check-in)**
   - A fixed routine with six questions:
     1. **Ankommen:** Wie fühlst du dich heute Morgen auf einer Skala von 1 bis 5?
     2. **Dankbarkeit:** Wofür bist du heute dankbar?
     3. **Loslassen:** Was möchtest du heute bewusst loslassen?
     4. **Energie:** Was gibt dir heute Energie?
     5. **Ein guter Tag:** Welche kleine Sache macht diesen Tag gut?
     6. **Absicht:** Welche freundliche Absicht nimmst du in den Tag mit?
   - The UI presents one question at a time. The first response is a 1–5 mood rating; the remaining responses are optional free text.

2. **30-Second Breathing Exercise**
   - A skippable, 30-second visual exercise precedes the questions.
   - The breathing cue is four seconds inhaling and six seconds exhaling. The check-in begins when the timer ends or the person skips the exercise.

3. **Optional Coach Summary**
   - After the check-in, the app can request a short, supportive, non-clinical reflection based only on the submitted answers.
   - The reflection follows the predominant language of the answers and defaults to German when the answers are mixed.
   - A Daily Snapshot remains complete when summary generation is unavailable or disabled. A blank check-in does not call the model.

4. **Daily Snapshot and Personal Journal**
   - A completed routine creates a Daily Snapshot containing its date, mood rating, all six responses, and an optional Coach Summary.
   - The Personal Journal presents snapshots newest first and provides a detail view for each snapshot.
   - A Journal Export backs up the saved snapshots. The entire Personal Journal can be deleted locally.

5. **Browser-Based Journal Storage**
   - The Personal Journal is stored in `localStorage` for the current browser profile.
   - A versioned, namespaced JSON document contains unfinished Morning Check-ins and completed Daily Snapshots. The Personal Journal Store encapsulates access, autosave, resume, completion, export, and deletion; UI components do not access `window.localStorage` directly.
   - The browser-local calendar day determines the check-in. There can be at most one completed Daily Snapshot per day; completed snapshots remain immutable.
   - `localStorage` does not provide synchronization, encryption, or authentication. Switching browsers, devices, or browser profiles does not make the journal available automatically.

6. **Future Integrations**
   - Optional webhooks/events, for example:
     - Trigger in Home Assistant when a Morning Check-in is complete.
     - Email or push reminders for the next morning.
   - These are not part of the MVP.

## Project Structure

A monorepo with a Next.js frontend and a stateless FastAPI backend.

```text
gratitude-morning-coach/
├── frontend/
│   ├── app/                 # Home, check-in, journal, and snapshot routes
│   ├── components/          # Check-in, snapshots, journal, and shared UI
│   ├── lib/
│   │   ├── api/             # API client and backend transport
│   │   ├── personal-journal-store.ts
│   │   └── user-profile-store.ts
│   ├── tests/
│   └── package.json
├── backend/
│   ├── app/                 # Health Check and Coach Summary service
│   ├── tests/
│   ├── pyproject.toml
│   └── uvicorn_app.py
├── docs/
│   ├── adr/
│   └── agents/
├── AGENTS.md
├── GLOSSARY.md
├── README.md
└── compose.yaml
```
