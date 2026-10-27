Status: ready-for-agent

# Browser-Local Personal Journal Storage

## Problem Statement

Das Personal Journal wird derzeit im FastAPI-Backend mit TinyDB gespeichert. Dadurch benötigt die Anwendung für ein einzelnes privates Browser-Profil einen dauerhaft beschreibbaren Server-Datenträger und einen zustandsbehafteten Backend-Prozess. Das widerspricht dem inzwischen gewählten Modell: User Profile und lokale Nutzung sollen an den Browser gebunden sein, während nur die optionale Coach Summary serverseitig über OpenAI erzeugt wird.

## Solution

Verlagere die vollständige Personal-Journal-Persistenz in den `localStorage` des Browsers. Der Browser speichert dort laufende Morning Check-ins, abgeschlossene Daily Snapshots, Antworten, Coach-Summary-Status und Journal-Daten. Das Frontend verwendet dafür einen testbaren Personal-Journal-Store und behält die bestehende API-Client-Seam gegenüber den UI-Komponenten bei.

Das FastAPI-Backend wird stateless. Es verwaltet keine TinyDB mehr und enthält keine Journal-History, keine Check-in-Zustände und keine Exportdaten. Es stellt weiterhin einen Health Check und eine serverseitige Coach-Summary-API bereit. Diese API erhält ausschließlich die aktuellen Antworten und die erkannte Zielsprache, liest `OPENAI_API_KEY` aus einer Backend-Umgebungsvariable und gibt eine Coach Summary oder einen kontrollierten Fehler bzw. leeren Erfolg zurück. Der OpenAI-Schlüssel wird niemals an den Browser übertragen.

## User Stories

1. As the journal owner, I want my Personal Journal to be stored in my browser, so that the application does not require a server-side journal database.
2. As the journal owner, I want unfinished Morning Check-in responses to survive a browser refresh, so that I can resume the routine without losing my progress.
3. As the journal owner, I want completed Daily Snapshots to remain available in the same browser profile, so that I can revisit my history without a running database service.
4. As the journal owner, I want the browser-local calendar date to determine today’s Morning Check-in, so that check-ins remain aligned with my local day.
5. As the journal owner, I want at most one completed Daily Snapshot for each browser-local date, so that my Personal Journal has one clear daily record.
6. As the journal owner, I want an unfinished Morning Check-in to resume automatically, so that an interruption does not force me to start over.
7. As the journal owner, I want to restart an unfinished Morning Check-in deliberately, so that I can discard partial responses and begin again.
8. As the journal owner, I want each answer to be written to browser storage immediately, so that navigation or an accidental refresh does not lose the latest response.
9. As the journal owner, I want to leave any question unanswered, so that the low-pressure routine remains valid.
10. As the journal owner, I want a Blank Check-in to create a Daily Snapshot without calling OpenAI, so that an empty routine does not consume API usage.
11. As the journal owner, I want the six fixed German questions to behave exactly as before, so that changing the storage location does not change the Morning Check-in experience.
12. As the journal owner, I want mood answers to retain their 1–5 validation, so that invalid values cannot corrupt my Mood Trend or Daily Snapshot.
13. As the journal owner, I want completed Daily Snapshots to be immutable, so that browser-side persistence does not make historical records accidentally editable.
14. As the journal owner, I want my Personal Journal to be ordered newest first, so that recent Daily Snapshots are easiest to find.
15. As the journal owner, I want to open a Daily Snapshot directly from the Personal Journal, so that browser-local identifiers continue to support detail views.
16. As the journal owner, I want the Mood Trend to use browser-local snapshots, so that the chart works without a backend history request.
17. As the journal owner, I want the automatic theme to use browser-local snapshots, so that theme behavior remains available when the backend is offline.
18. As the journal owner, I want to download a lossless JSON Journal Export from browser storage, so that I can back up all answers and Coach Summaries.
19. As the journal owner, I want the Journal Export to include unfinished and completed data according to the defined export contract, so that an interrupted Morning Check-in can also be backed up when appropriate.
20. As the journal owner, I want to delete the Personal Journal locally, so that the existing deletion control removes stored check-ins and snapshots from this browser profile.
21. As the journal owner, I want deleting the Personal Journal not to delete my User Profile, PIN, Security Challenge, or theme settings, so that access configuration remains separate from journal content.
22. As the journal owner, I want to see a useful local-storage error when the browser cannot persist data, so that I understand why a response cannot be saved.
23. As the journal owner, I want the application to work after the backend is unavailable, so that reading existing snapshots and continuing non-summary journal activity does not depend on a database server.
24. As the journal owner, I want the backend to receive only the current check-in answers when generating a Coach Summary, so that my historical Personal Journal is not sent to OpenAI.
25. As the journal owner, I want the Coach Summary to follow the predominant language of my answers and default to German for mixed answers, so that the storage migration does not alter language behavior.
26. As the journal owner, I want a Daily Snapshot to remain complete when OpenAI is unavailable, so that an LLM outage cannot lose my locally saved reflection.
27. As the journal owner, I want a failed Coach Summary to be represented locally as unavailable with the existing German fallback note, so that the UI remains understandable without technical details.
28. As the journal owner, I want a failed Coach Summary to be retryable when a generator is configured, so that I can request the optional reflection again without recreating the Daily Snapshot.
29. As the journal owner, I want the OpenAI API key to remain on the backend, so that browser storage and browser developer tools do not expose the secret through application configuration.
30. As the journal owner, I want my User Profile to remain in its existing browser-local storage entry, so that onboarding, Lock Screen, PIN Reset, and logout continue to work independently of journal migration.
31. As the journal owner, I want a single browser profile to be the storage boundary, so that the current single-user, private-device model remains explicit.
32. As the journal owner, I want the app to explain that browser-local storage is device- and browser-profile-specific, so that I understand why the journal is not automatically available in another browser or device.
33. As the journal owner, I want existing TinyDB data to have a defined migration or backup path, so that changing the source of truth does not silently destroy records already stored by the current deployment.
34. As the journal owner, I want the frontend to use one consistent journal-storage boundary across Home, Morning Check-in, Personal Journal, Daily Snapshot, export, deletion, and automatic theming, so that different screens cannot disagree about the stored journal.

## Implementation Decisions

- `localStorage` becomes the sole source of truth for Morning Check-ins and the Personal Journal in the production frontend. The existing User Profile and Coach Summary setting remain separate namespaced browser-local values.
- Introduce one browser-safe, replaceable Personal Journal Store interface as the highest persistence seam. It must cover retrieving or creating today’s Morning Check-in, saving an answer, restarting an unfinished check-in, completing a check-in, listing snapshots, finding a snapshot by identifier, deleting journal data, and creating an export payload.
- Keep the existing `PersonalJournalApiClient` interface as the UI-facing seam where practical, but change its default implementation from HTTP persistence calls to the browser-local store. UI components must not call `window.localStorage` directly.
- The default browser-local store must be safe for client-only use. Server rendering and test environments without `window` must not crash during module import or render. Browser storage failures must surface as controlled store errors that the UI can render.
- Store one versioned, namespaced JSON document containing unfinished and completed Morning Check-ins. The schema must include the browser-local date, stable identifier, status, answers, next question number, Coach Summary, Coach Summary status, and retry availability. The schema version enables future migrations without reintroducing a server database.
- Use a stable generated identifier for each Morning Check-in. Identifiers are local references only and do not represent a server-side account or identity.
- Preserve the current domain rules: six fixed German questions, optional answers, mood 1–5 validation, one unfinished check-in per date, at most one completed Daily Snapshot per date, restart only for unfinished check-ins, and immutability after completion.
- Local completion must persist the completed Daily Snapshot before attempting Coach Summary generation. The completion result must remain available if the backend call fails, times out, returns no text, or is not configured.
- Change Coach Summary generation to a stateless backend operation. The request contains only the current answers and target language; it must not contain journal history, User Profile data, PIN data, browser-storage contents beyond the current answers, or a user identifier.
- The backend Coach Summary endpoint reads `OPENAI_API_KEY` from the backend environment. No `NEXT_PUBLIC_` variable, response field, client bundle value, or browser-local record may contain the key.
- The Coach Summary backend may retain the existing replaceable generator boundary and language detection behavior. The backend must return a clear success response containing text or a controlled unavailable response; it must not persist the result.
- The frontend attaches a successful Coach Summary to the locally stored Daily Snapshot. A failed generation stores the existing unavailable note and retry state locally. A retry updates only the existing completed snapshot and never creates a second Daily Snapshot.
- If the Coach Summary setting is disabled, the frontend must complete locally with `not_requested` and must not call the backend Coach Summary endpoint.
- A Blank Check-in must complete locally with `not_requested` and must not call the backend.
- Remove TinyDB as a runtime persistence dependency and remove backend journal CRUD, journal listing, journal export, and journal deletion responsibilities. The backend retains only stateless service concerns such as health and Coach Summary generation.
- Remove or update backend settings, models, tests, documentation, and startup assumptions that exist only to configure or access TinyDB. The backend must not create a data directory or journal file when it starts.
- Keep the HTTP client injectable for frontend tests. Tests may provide an in-memory Personal Journal Store or a fake Coach Summary transport; production defaults must use browser storage and the real backend Coach Summary transport.
- The Journal Export is generated from the browser-local store and keeps the existing JSON representation of Daily Snapshots. The export must not depend on backend availability.
- Define the export scope explicitly during implementation: completed Daily Snapshots are mandatory; unfinished check-ins should be included only if the existing product behavior and UI are intentionally extended to restore them. The default migration should not expose incomplete records as completed history.
- Keep deletion local and synchronous from the user’s perspective: clear the Personal Journal storage document, update visible state, and leave User Profile, PIN, Security Challenge, Coach Summary preference, and theme settings untouched.
- Add a user-visible privacy or storage note stating that Personal Journal data is stored in this browser profile and is not automatically synchronized across browsers or devices. The existing OpenAI disclosure must additionally state that only current answers are sent for an optional Coach Summary.
- Existing TinyDB records require an explicit migration path. Provide a one-time conversion/import mechanism or documented export-before-upgrade procedure; do not silently claim that server-side records are available in a new browser-local store. Migration must preserve IDs, dates, answers, completion status, and Coach Summary fields where the source data contains them.
- The application remains intended for one private browser profile. Moving data to `localStorage` is not authentication, encryption, multi-device synchronization, or protection against a person with DevTools access.
- Because the journal is browser-local, hosting no longer requires a persistent application volume. The frontend can be hosted as a normal Next.js deployment, while the stateless backend only needs secure environment-variable configuration and network access from the browser.

## Testing Decisions

- Test externally observable behavior through the existing UI components and the existing injected API-client seam. Do not assert implementation details such as a specific React state variable or direct calls to `localStorage` from individual components.
- Add focused store contract tests against an in-memory implementation and the browser `localStorage` implementation. The same contract must cover create/resume, autosave, restart, completion uniqueness, immutability, ordering, find-by-id, deletion, export, schema handling, and storage failure behavior.
- Extend frontend journey tests to verify that a response and completed Daily Snapshot survive a remount using the same browser storage, and that a new browser-storage state begins with no Personal Journal records.
- Test that Home, Personal Journal, Daily Snapshot detail, Mood Trend, automatic theming, export, and deletion all read from the same browser-local source and remain usable without a journal HTTP request.
- Test the local completion boundary with a fake Coach Summary transport. Cover successful generation, opt-out, Blank Check-in, empty generation, thrown generation error, unavailable state, and retry updating the existing snapshot.
- Test the Coach Summary HTTP boundary independently with mocked fetch responses. Assert that the request contains only current answers and target language and that no OpenAI key is present in request or response data.
- Keep backend tests at the HTTP seam for the reduced stateless service. Use a fake generator and environment/configuration injection; tests must not use TinyDB and must never call OpenAI.
- Backend tests must cover health, valid Coach Summary requests, optional/unavailable generator behavior, malformed answers, language handling, and controlled failure responses.
- Frontend validation tests must retain coverage for mood values 1–5 and reject invalid mood values before local persistence or Coach Summary requests.
- Export tests should parse the downloaded JSON payload and compare its externally visible records with the locally stored completed Daily Snapshots, rather than checking serialization implementation details.
- Migration tests must verify that supported legacy records are converted without changing dates, answers, completion state, summaries, or identifiers, and that malformed legacy data fails safely without replacing valid local data.
- Prior art includes the existing API-client tests, Morning Check-in journey tests, Personal Journal page tests, Daily Snapshot tests, User Profile Store tests, theme tests, mood tests, and backend FastAPI tests using fake Coach Summary generators.

## Out of Scope

- Server-side accounts, authentication, authorization, user identifiers, or multi-user data isolation.
- Encryption or hashing of `localStorage` data, including the existing PIN soft gate.
- Synchronization between browsers, devices, OS users, or deployments.
- Replacing `localStorage` with IndexedDB, a hosted database, filesystem persistence, or a service worker cache.
- Public exposure of the application without a separate authentication and security design.
- Sending Personal Journal history, User Profile data, PINs, or Security Challenge data to OpenAI.
- Changing the six-question Morning Check-in content, the Breathing Exercise, Mood Scale, Mood Trend rules, or Coach Summary safety requirements except where necessary to remove TinyDB dependencies.
- Editing or deleting individual completed Daily Snapshots. The existing whole-Personal-Journal deletion behavior remains in scope.
- Background Coach Summary jobs, automatic retries, provider selection, reminders, notifications, analytics, or integrations.
- Automatic cloud backup of browser-local data. The Journal Export remains the user-controlled backup mechanism.
- Guaranteeing recovery of data after browser storage is cleared, private browsing ends, browser profile removal, device loss, or browser quota exhaustion.

## Further Notes

- This specification supersedes the TinyDB persistence decisions in the original Morning Coach MVP specification and the architecture draft wherever they describe the Personal Journal as backend-owned.
- The User Profile remains browser-local, but it is not the same data as the Personal Journal. Deleting or migrating journal data must not implicitly alter onboarding, Lock Screen, PIN Reset, or logout behavior.
- The browser-local model changes the hosting recommendation: a persistent VPS volume is no longer required for journal retention. The backend still requires protected environment configuration for `OPENAI_API_KEY` and should not be treated as a public unauthenticated data API.
- Existing deployments should create a Journal Export or run the agreed migration procedure before upgrading. The implementation must document the behavior for existing TinyDB data rather than silently discarding it.
