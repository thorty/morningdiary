Status: ready-for-agent

# Morning Coach MVP

## Problem Statement

I want a private, lightweight web application that guides me through one gratitude-focused Morning Check-in each day. I need a calm, structured alternative to an open-ended chat, a saved Daily Snapshot I can revisit, and an optional LLM reflection without exposing my OpenAI API key or making the journal depend on a successful LLM request.

## Solution

Build a self-hosted, private-network-only application with a Next.js frontend and stateless FastAPI backend. The app starts with a skippable 30-second Breathing Exercise, then presents six fixed German questions one at a time. The browser-local Personal Journal Store saves responses as they are submitted, resumes an unfinished Morning Check-in on the same browser-local date, and produces one immutable Daily Snapshot per completed day.

The browser owns Personal Journal persistence through `localStorage`. FastAPI provides Health Check and a replaceable stateless Coach Summary Generator. The initial generator uses OpenAI with a backend-only API key, receives only the current check-in answers and target language, and produces a short supportive, non-clinical reflection. The Personal Journal shows snapshots newest first and can be downloaded as a complete JSON Journal Export.

## User Stories

1. As the journal owner, I want to open the app on my private LAN or VPN, so that I can use it without accounts or public exposure.
2. As the journal owner, I want a German start screen, so that the routine feels natural and consistent.
3. As the journal owner, I want to see a clear disclosure that only my current answers are sent to OpenAI for an optional Coach Summary, so that I understand the privacy boundary before starting.
4. As the journal owner, I want to start a Morning Check-in for my browser-local calendar day, so that the routine corresponds to my day rather than server time.
5. As the journal owner, I want a skippable 30-second Breathing Exercise with a visual timer and German four-seconds-in, six-seconds-out cues, so that I can pause before writing without being blocked when I am short on time.
6. As the journal owner, I want the first question to appear automatically after the Breathing Exercise finishes or I skip it, so that the routine remains focused and frictionless.
7. As the journal owner, I want to answer one fixed question at a time, so that I can focus on the current reflection rather than an entire form.
8. As the journal owner, I want to provide a mood rating from 1 to 5 for the first question, so that my Daily Snapshot can show my mood without requiring explanation text.
9. As the journal owner, I want one optional free-text field for each of the remaining five questions, so that I can write as much or as little as I want without forced list formatting.
10. As the journal owner, I want to leave every question blank, so that the routine remains low-pressure.
11. As the journal owner, I want each submitted response saved immediately, so that closing or refreshing the browser does not lose my progress.
12. As the journal owner, I want an unfinished Morning Check-in to resume automatically when I reopen the app on the same day, so that I can continue after an interruption.
13. As the journal owner, I want to restart an unfinished Morning Check-in deliberately, so that I can clear partial responses and begin again.
14. As the journal owner, I want to complete a blank Morning Check-in, so that I can preserve the routine even when I do not want to write.
15. As the journal owner, I want a completed Morning Check-in to create a Daily Snapshot, so that I have a durable record of the day.
16. As the journal owner, I want the Daily Snapshot to show its date, mood rating when supplied, and all submitted responses, so that I can revisit exactly what I recorded.
17. As the journal owner, I want an optional Coach Summary generated after the final response, so that I receive a compact reflection on my current answers.
18. As the journal owner, I want the Coach Summary to use the predominant language of my answers and default to German when answers are mixed, so that English responses are supported without changing the German routine.
19. As the journal owner, I want the Coach Summary to be supportive, non-clinical, and grounded only in my answers, so that it does not invent facts, diagnose, or give treatment advice.
20. As the journal owner, I want my Daily Snapshot to complete even if OpenAI is unavailable, so that an LLM outage never loses my reflection.
21. As the journal owner, I want a calm German note when a Coach Summary could not be created, so that I understand its absence without seeing technical errors or needing to retry.
22. As the journal owner, I want no OpenAI request for a Blank Check-in, so that empty routines do not consume API usage.
23. As the journal owner, I want only one completed Daily Snapshot per browser-local day, so that the Personal Journal retains a clear daily record.
24. As the journal owner, I want a completed Daily Snapshot to be immutable, so that my history remains an accurate record.
25. As the journal owner, I want to see my Personal Journal ordered newest first, so that recent reflections are easiest to find.
26. As the journal owner, I want to download a lossless JSON Journal Export containing all Daily Snapshots, answers, and any Coach Summaries, so that I can back up my data.
27. As the journal owner, I want the frontend to keep journal persistence in this browser and call the backend only for optional summaries, so that no server journal database or OpenAI API key is exposed to the browser.

## Implementation Decisions

- The application is a single-user Personal Journal with no accounts, authentication, `user_id`, or user selection.
- The application is self-hosted and reachable only through a LAN or private VPN. The Personal Journal requires no persistent server volume; the stateless backend still must not be directly exposed to the public internet without an authentication design.
- The frontend is a Next.js TypeScript application. The backend is a FastAPI Python application communicating with the frontend through REST.
- The Python backend uses `uv` as its required package manager for dependency installation, locking, test execution, and local service commands.
- `localStorage` exclusively owns Personal Journal persistence in the production frontend through the Personal Journal Store. The browser provides its local calendar date when retrieving or creating the day’s Morning Check-in, enforces at most one completed Daily Snapshot for that date, and permits one unfinished check-in to resume or restart.
- FastAPI is stateless and is the only layer allowed to invoke the Coach Summary Generator. It receives only current answers and target language; it never receives journal history or browser identity, and it never exposes `OPENAI_API_KEY`.
- A Morning Check-in has six fixed German questions. The first accepts an optional integer mood rating from 1 through 5. Each remaining question accepts one optional free-text value. The question set is deterministic and does not adapt to responses.
- Submitted responses are persisted incrementally. Restarting an unfinished Morning Check-in clears its stored responses; it cannot change a completed Daily Snapshot.
- Completion persists the Daily Snapshot before or independently of Coach Summary generation, so that LLM failures cannot prevent completion.
- A Blank Check-in is valid. It creates a Daily Snapshot with no Coach Summary and skips the generator.
- The Coach Summary Generator is a narrow replaceable backend boundary: it accepts the current check-in answers and yields Coach Summary text or no summary. The first implementation uses the simplest supported OpenAI Python integration and reads `OPENAI_API_KEY` from the backend environment.
- The OpenAI prompt and result handling must limit the Coach Summary to a short supportive, non-clinical reflection based only on submitted answers. It must not diagnose, give medical or mental-health treatment advice, or invent facts.
- The generator receives only current Morning Check-in answers. It must not receive the Personal Journal history, user identifiers, or unrelated metadata.
- Determine Coach Summary language from the predominant answer language; use German for mixed answers. The frontend interface and questions remain German.
- When generation returns no summary or fails, the Daily Snapshot displays `Deine Zusammenfassung konnte heute nicht erstellt werden.` without technical details or a retry control.
- The Breathing Exercise is a client-side visual timer only. It lasts 30 seconds, uses the fixed German four-seconds-in/six-seconds-out cue, may be skipped, and is not persisted.
- The Personal Journal Store lists retained Daily Snapshots newest first and creates a downloadable, lossless JSON representation of the entire Personal Journal. The backend API is limited to Health Check and stateless Coach Summary generation.
- Existing TinyDB files require a one-time developer migration before upgrade; there is no product import UI or public migration endpoint.

## Testing Decisions

- Test externally observable behavior rather than internal implementation details.
- Treat the Personal Journal Store and stateless Coach Summary HTTP API as the primary seams. Use an in-memory/browser-storage store and a fake Coach Summary Generator so tests are deterministic and never call OpenAI.
- Store tests must cover daily uniqueness, browser-supplied date handling, response autosave and resume, restart behavior, valid blank completion, completed snapshot immutability, newest-first history, and lossless JSON export. Backend tests cover only the stateless Health Check and Coach Summary contract.
- Validate API input at the seam, including the 1-5 mood range and malformed or unknown check-in state, with meaningful client-visible failures.
- Frontend tests should use mocked API responses to verify the visible Breathing Exercise finish/skip transition, one-question progression, optional responses, resumed state, completed snapshot rendering, missing-summary note, history ordering display, and export action.
- The repository has no implementation or test prior art. Select lightweight standard tooling appropriate to the chosen Next.js and FastAPI scaffolds; do not introduce OpenAI-dependent automated tests.

## Out of Scope

- Authentication, accounts, multi-user access, or public internet exposure.
- Reminders, email, push notifications, Home Assistant webhooks, and other integrations.
- Editing or deleting individual completed Daily Snapshots. Whole-Personal-Journal deletion remains a local product operation.
- Analytics, mood trends, insights across history, or sending history to the LLM.
- Adaptive or follow-up questions based on answers or mood.
- Audio-guided meditation, configurable breathing patterns, and persistence of the Breathing Exercise.
- LLM retries, technical error details in the interface, or an LLM provider selection UI.
- Timezone configuration and automatic language selection for the frontend.

## Further Notes

- The original architecture draft is in `doc/app.md`; this specification supersedes it where the two differ. In particular, the MVP has no `user_id`, every response is optional, Q2 and Q3 are free text rather than required three-item lists, and a failed LLM summary does not block completion.
- TinyDB was the historical persistence mechanism. Existing records must be backed up and migrated once before removing that runtime dependency; it is not the source of truth after the browser-local migration.
