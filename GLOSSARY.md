# Gratitude Morning Coach

A personal web journal for completing one guided gratitude routine each morning and retaining its daily reflection.

## Language

**Morning Check-in**:
The guided six-question routine a person completes for the browser-local calendar day. The six fixed questions cover: Ankommen (mood 1–5), Dankbarkeit, Loslassen, Energie, Ein guter Tag, and Absicht. Each submitted response is saved; at most one Morning Check-in can be completed per day, while an unfinished one automatically resumes or may be restarted.
_Avoid_: Session, interview, flow

**Daily Snapshot**:
The completed, saved reflection produced by a Morning Check-in, including its answers and generated coach summary.
_Avoid_: Entry, summary, journal record

**Personal Journal**:
The single collection of Daily Snapshots held in the current browser profile's `localStorage`. It has no user identity, accounts, or synchronization between browsers or devices in v1; snapshots are retained indefinitely and viewed newest first. The browser-local store also retains the current unfinished Morning Check-in.
_Avoid_: Account, user journal, profile

**Personal Journal Store**:
The replaceable frontend persistence boundary for unfinished Morning Check-ins, completed Daily Snapshots, Journal Export, and local deletion. UI components use this boundary instead of accessing `window.localStorage` directly. Its production implementation uses one versioned, namespaced `localStorage` document.
_Avoid_: Backend journal API

**Coach Summary**:
An optional, supportive, non-clinical reflection attached to a Daily Snapshot. It follows the predominant language of the check-in answers, defaulting to German when they are mixed; it is grounded only in those answers and never diagnoses, gives treatment advice, or invents facts. A Daily Snapshot remains complete when a Coach Summary cannot be generated. When the user opts out at completion time, the status is `not_requested` and no generation is attempted.
_Avoid_: Required summary, completion result

**Coach Summary Retry**:
When Coach Summary generation fails (generator not configured or exception), the status is `unavailable` and a retry is offered on the next completion request — provided a generator is configured and the check-in has at least one answer. No retry is offered for a Blank Check-in or when generation already succeeded.
_Avoid_: Automatic retry, background retry

**Coach Summary Generator**:
The replaceable server-side boundary in the stateless backend that turns the current Morning Check-in responses into a Coach Summary or no summary. Its initial implementation uses OpenAI, reads `OPENAI_API_KEY` only from backend environment configuration, never persists journal data, and never exposes the key to the browser.
_Avoid_: OpenAI call, chatbot

**Stateless Backend**:
The FastAPI service that provides Health Check and optional Coach Summary generation. It does not persist Morning Check-ins, Daily Snapshots, Journal Exports, User Profiles, or browser-storage data. A Coach Summary request contains only the current answers and target language.
_Avoid_: Journal backend

**Journal Export**:
A downloadable JSON backup containing every Daily Snapshot in the Personal Journal, including answers and any Coach Summary.
_Avoid_: Report, CSV export

**MVP**:
The first releasable version of the Personal Journal: Morning Check-in, Breathing Exercise, Daily Snapshot, history, Journal Export, and local whole-journal deletion. It excludes reminders, integrations, editing or deletion of individual completed Daily Snapshots, analytics, accounts, and adaptive questions.
_Avoid_: Full product, roadmap

**Routine Language**:
German, the fixed language of the v1 interface and Morning Check-in questions. Answers may be written in German or English.
_Avoid_: UI locale, language selector

**Check-in Response**:
An optional response to one Morning Check-in question. The mood question is a 1-5 rating; each other question accepts one free-text response without a required list structure.
_Avoid_: Required answer, parsed list

**Blank Check-in**:
A completed Morning Check-in with no responses. It creates a Daily Snapshot without a Coach Summary and does not call the LLM.
_Avoid_: Invalid check-in, abandoned check-in

**Breathing Exercise**:
A skippable, unsaved 30-second visual prelude to a Morning Check-in, using the fixed German cue of four seconds inhaling and six seconds exhaling.
_Avoid_: Meditation record, required step

**Mood Scale**:
The five canonical mood levels (1–5), each permanently mapped to a fixed emoji: 😞 (1), 😐 (2), 🙂 (3), 😊 (4), 😄 (5). Used on the mood capture form, the Mood Trend y-axis, and the Daily Snapshot display. The integer is stored; the emoji is always derived from it.
_Avoid_: Rating, score, numeric mood

**Mood Trend**:
A time-series line chart of mood across Daily Snapshots, covering at most the last 14 days. The x-axis is time with a step that widens dynamically when labels would overlap; the y-axis renders Mood Scale emojis at each of the five levels. Replaces the previous polyline sparkline on every surface where it appeared.
_Avoid_: Mood chart, mood graph, mood history

**User Profile**:
A name and PIN stored in `localStorage` that identifies one person per browser profile. There is exactly one User Profile per browser profile. It is not a server-side account and carries no server identity; its purpose is soft access-gating so that a casual family member cannot read the journal without knowing the PIN.
_Avoid_: Account, user account, login credentials

**Onboarding**:
The first-run experience shown only when no User Profile exists: an app description, a privacy notice (Personal Journal data is stored in this browser profile; only current answers are sent anonymously to OpenAI for an optional Coach Summary; opt-out is available in Settings), and a Name + PIN + Security Challenge setup form. Shown exactly once; not shown again after setup is complete.
_Avoid_: Registration, signup, welcome screen

**Lock Screen**:
The screen shown when a User Profile exists but no PIN has been entered for the current browser session, or after the user logs out. Displays the stored name with a welcome-back greeting and a PIN input field, plus a PIN Reset trigger.
_Avoid_: Login page, authentication screen, sign-in page

**PIN Reset**:
A data-preserving flow where the user correctly answers their Security Challenge in order to set a new PIN. The User Profile name, the Security Challenge itself, and all journal data remain untouched.
_Avoid_: Profile reset, account recovery, data wipe

**Security Challenge**:
A user-defined question and answer stored in `localStorage` alongside the PIN. Used only to recover access via PIN Reset when the PIN is forgotten. A UX convenience to prevent lockout — not a cryptographic security measure.
_Avoid_: Security question, authentication factor, password recovery
