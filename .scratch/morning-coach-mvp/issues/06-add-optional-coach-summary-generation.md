# 06 — Add optional Coach Summary generation

**What to build:** After completing a non-blank Morning Check-in, the Daily Snapshot can include an optional Coach Summary generated through a replaceable server-side generator initially backed by OpenAI. The summary is supportive and non-clinical, based only on current answers, while failure still produces a completed snapshot with the agreed German absence note.

**Blocked by:** 05 — Complete Daily Snapshot without an LLM.

**Status:** ready-for-agent

- [ ] The backend introduces a replaceable Coach Summary Generator boundary; its OpenAI implementation reads its API key only from backend environment configuration.
- [ ] Only current Morning Check-in answers reach the generator; no Personal Journal history, identifier, or unrelated metadata is sent.
- [ ] Generated text follows the predominant answer language, defaults to German for mixed answers, and is constrained to a short supportive, non-clinical reflection grounded only in supplied answers.
- [ ] Generator failure or no generated text leaves the Daily Snapshot complete and shows `Deine Zusammenfassung konnte heute nicht erstellt werden.` without technical details or retry control.
- [ ] Deterministic API and UI tests use fake generators and cover success, language selection, failure, and the existing no-generator behavior for a Blank Check-in.
