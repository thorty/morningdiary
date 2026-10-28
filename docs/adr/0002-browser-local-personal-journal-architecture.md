# Browser-local personal journal architecture

Status: accepted

## Context

Morning Coach is a personal journal app designed for a single-browser-profile, home-use workflow. The core product is a guided morning routine that stores the person's reflections locally and optionally asks a backend service for a short coach summary.

The design goal is to keep the app simple, privacy-preserving, and resilient. The journal should remain usable even when the backend is unavailable, and the backend should not become another source of truth for user data. The app is not a multi-user SaaS product and has no server-side accounts or synchronized data.

The architecture therefore avoids server-side authentication, server-side journal storage, and data synchronization. A browser profile already provides a natural boundary for local data, and the app adds a soft personal gate (locally stored name, PIN, and Security Challenge) to reduce accidental access on a shared device.

## Decision

The Personal Journal, unfinished Morning Check-ins, completed Daily Snapshots, Journal Export data, and local deletion live in the frontend browser profile, in one versioned, namespaced `localStorage` document behind the Personal Journal Store boundary. UI code uses that store and never accesses `window.localStorage` directly.

The FastAPI backend is intentionally stateless. It provides only a health check and optional Coach Summary generation. It stores no journal data, User Profiles, exports, or browser-side state. A Coach Summary request contains only the current answers and the target language.

The OpenAI API key lives only in backend environment configuration and is never exposed to the browser. A Daily Snapshot remains complete even if summary generation is unavailable, disabled, or fails.

## Consequences

- The browser profile is the source of truth for daily reflections, unfinished check-ins, and profile data.
- The app remains usable when the backend is unavailable; only the optional Coach Summary is degraded.
- The architecture is deliberately not multi-user, not synchronized across devices, and not backed by server-side authentication.
- The backend is simpler to reason about and keep private because it never holds long-lived user data.
- Data is lost if the browser profile is cleared. This is acceptable for the current threat model and product scope; Journal Export is the backup path.

## Alternatives considered

- **Server-side journal storage with a database and per-user accounts** — rejected: adds user management, auth, tokens, and data isolation without matching the single-device personal use case.
- **No local gate** — rejected: a casual family member could read the journal on an unlocked shared device. See [ADR-0001](./0001-user-profile-as-client-side-soft-gate.md).
- **Server-side auth with per-user identity** — rejected: a much larger backend responsibility than the product needs, and contrary to the local-first privacy goal.

## Related documentation

- [ADR-0001: User Profile as client-side soft gate](./0001-user-profile-as-client-side-soft-gate.md)
- [GLOSSARY.md](../../GLOSSARY.md)
- [Workflow](../agents/workflow.md)
