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
The single collection of Daily Snapshots held by this application. It has no user identity, accounts, or shared access in v1; snapshots are retained indefinitely and viewed newest first from its self-hosted deployment, which is accessible only on a LAN or private VPN.
_Avoid_: Account, user journal, profile

**Coach Summary**:
An optional, supportive, non-clinical reflection attached to a Daily Snapshot. It follows the predominant language of the check-in answers, defaulting to German when they are mixed; it is grounded only in those answers and never diagnoses, gives treatment advice, or invents facts. A Daily Snapshot remains complete when a Coach Summary cannot be generated. When the user opts out at completion time, the status is `not_requested` and no generation is attempted.
_Avoid_: Required summary, completion result

**Coach Summary Retry**:
When Coach Summary generation fails (generator not configured or exception), the status is `unavailable` and a retry is offered on the next completion request — provided a generator is configured and the check-in has at least one answer. No retry is offered for a Blank Check-in or when generation already succeeded.
_Avoid_: Automatic retry, background retry

**Coach Summary Generator**:
The replaceable server-side boundary that turns Morning Check-in responses into a Coach Summary or no summary. Its initial implementation uses OpenAI without exposing the API key to the browser and receives only the current check-in answers.
_Avoid_: OpenAI call, chatbot

**Journal Export**:
A downloadable JSON backup containing every Daily Snapshot in the Personal Journal, including answers and any Coach Summary.
_Avoid_: Report, CSV export

**MVP**:
The first releasable version of the Personal Journal: Morning Check-in, Breathing Exercise, Daily Snapshot, history, and Journal Export. It excludes reminders, integrations, editing or deletion, analytics, accounts, and adaptive questions.
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
