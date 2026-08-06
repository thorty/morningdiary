Status: ready-for-agent

# Lovable Frontend Redesign

## Problem Statement

Das bestehende Next.js-Frontend stellt den Morning Check-in und das Personal Journal funktional bereit, bietet aber noch keine ruhige, visuell konsistente und fokussierte Nutzungserfahrung. Die unter Lovable erstellte Designvorlage zeigt die gewünschte Gestaltung und Nutzerführung, verwendet jedoch ein anderes Frontend-Framework, andere Datenstrukturen und lokale Browser-Persistenz.

Das Design soll deshalb in das bestehende Next.js-Frontend übertragen werden, ohne die FastAPI-Persistenz, bestehende API-Verträge oder fachliche Regeln des Morning Coach MVP zu ersetzen. Die Umstellung soll zunächst als risikoarmer Ein-Seiten-Flow erfolgen und anschließend auf einen klar getrennten mehrseitigen Flow erweitert werden.

## Solution

Das produktive Frontend bleibt eine Next.js-TypeScript-Anwendung. Die Lovable-Anwendung dient ausschließlich als Design- und Interaktionsvorlage.

Im ersten Umsetzungsschritt wird der bestehende Ein-Seiten-Flow visuell und strukturell überarbeitet. Startansicht, Breathing Exercise, Morning Check-in, Daily Snapshot und Personal Journal bleiben auf derselben Seite, erhalten aber die Designsprache und fokussierte Nutzerführung der Lovable-Vorlage.

Im zweiten Umsetzungsschritt werden dieselben Komponenten und dieselbe Datenlogik auf separate Next.js-Seiten für Start, Morning Check-in, Personal Journal und Daily-Snapshot-Details verteilt. Die FastAPI-API bleibt dabei die einzige Quelle für persistierte Morning Check-ins und Daily Snapshots.

## User Stories

1. As the journal owner, I want the redesigned application to remain a Next.js application, so that the existing frontend architecture remains supported.
2. As the journal owner, I want the Lovable project to be used as a design reference only, so that no second production frontend is introduced.
3. As the journal owner, I want my Morning Check-ins and Daily Snapshots to remain stored by FastAPI, so that the redesign does not move private data into browser storage.
4. As the journal owner, I want the existing API behavior to remain compatible, so that the redesign does not risk losing existing functionality.
5. As the journal owner, I want a calm, warm and coherent visual design, so that the morning routine feels inviting rather than technical.
6. As the journal owner, I want the interface to work on mobile and desktop, so that I can complete the routine on my preferred device.
7. As the journal owner, I want readable typography and sufficient contrast, so that the interface remains accessible.
8. As the journal owner, I want reduced animations when my device requests reduced motion, so that motion does not create discomfort.
9. As the journal owner, I want the interface and Morning Check-in questions to remain German, so that the Routine Language stays consistent.
10. As the journal owner, I want to see the current date and an appropriate greeting, so that the start page feels connected to my day.
11. As the journal owner, I want a concise explanation of the Morning Check-in, so that I understand what will happen before starting.
12. As the journal owner, I want a prominent action for starting today's Morning Check-in, so that the primary next step is obvious.
13. As the journal owner, I want the start action to indicate whether today's Morning Check-in is new, unfinished or completed, so that I understand its current state.
14. As the journal owner, I want an unfinished Morning Check-in to resume, so that an interruption does not lose my progress.
15. As the journal owner, I want a completed Morning Check-in to show today's immutable Daily Snapshot, so that I can revisit it without accidentally changing it.
16. As the journal owner, I want the OpenAI privacy boundary communicated without dominating the page, so that I remain informed without disrupting the calm design.
17. As the journal owner, I want service failures presented as understandable status messages, so that technical failures do not overwhelm the experience.
18. As the journal owner, I want a 30-second visual Breathing Exercise before the questions, so that I can pause before reflecting.
19. As the journal owner, I want four-second inhale and six-second exhale cues, so that the Breathing Exercise follows the established routine.
20. As the journal owner, I want a visible countdown and progress indicator, so that I know how long the Breathing Exercise will take.
21. As the journal owner, I want to skip the Breathing Exercise, so that it never blocks the Morning Check-in.
22. As the journal owner, I want the first question to open automatically when breathing finishes, so that the routine progresses without extra interaction.
23. As the journal owner, I want to see one question at a time, so that I can focus on the current Check-in Response.
24. As the journal owner, I want visible question progress, so that I know where I am within the six questions.
25. As the journal owner, I want to choose my mood from an accessible scale of 1 through 5, so that I do not need to type a numeric value.
26. As the journal owner, I want each mood option to have a clear label and selected state, so that the control is understandable without relying only on color.
27. As the journal owner, I want one free-text response for each remaining question, so that the UI matches the existing Morning Check-in model.
28. As the journal owner, I want every Check-in Response to remain optional, so that the routine stays low-pressure.
29. As the journal owner, I want each submitted response saved before moving forward, so that my progress remains durable.
30. As the journal owner, I want a clear saving state, so that I do not submit the same response repeatedly.
31. As the journal owner, I want saving errors shown within the current question, so that I can understand and retry the failed action.
32. As the journal owner, I want to restart an unfinished Morning Check-in deliberately, so that I can clear partial responses when necessary.
33. As the journal owner, I want restart to remain a secondary action, so that it is not triggered accidentally.
34. As the journal owner, I want the Morning Check-in to complete after the sixth response is submitted, so that no additional completion form is required.
35. As the journal owner, I want to see a completion state while the Daily Snapshot is created, so that I know the final action is processing.
36. As the journal owner, I want a Blank Check-in to remain valid, so that the redesign preserves existing behavior.
37. As the journal owner, I want the Daily Snapshot displayed as a visually distinct card, so that completion feels clear and rewarding.
38. As the journal owner, I want the Daily Snapshot to show its date, mood and all Check-in Responses, so that it accurately reflects what I submitted.
39. As the journal owner, I want the Coach Summary shown prominently when available, so that I can quickly read the reflection.
40. As the journal owner, I want a calm fallback message when no Coach Summary is available, so that the Daily Snapshot still feels complete.
41. As the journal owner, I want completed Daily Snapshots to remain immutable, so that the redesign does not change the Personal Journal's historical integrity.
42. As the journal owner, I want recent Daily Snapshots shown newest first, so that recent mornings are easiest to revisit.
43. As the journal owner, I want an empty state when the Personal Journal has no Daily Snapshots, so that the page still provides a useful next action.
44. As the journal owner, I want loading and failure states for the Personal Journal, so that missing content is not mistaken for an empty journal.
45. As the journal owner, I want to see a compact mood trend based on recent Daily Snapshots, so that I can recognize the recorded mood values at a glance.
46. As the journal owner, I want the mood trend derived only in the browser from existing snapshots, so that no new analytics or backend data collection is introduced.
47. As the journal owner, I want to download the existing JSON Journal Export, so that redesigning the journal does not remove my backup capability.
48. As the journal owner, I want the first redesigned release to retain a single-page experience, so that visual changes can be stabilized before routing changes.
49. As the journal owner, I want the stabilized experience subsequently separated into focused pages, so that navigation and responsibilities become clearer.
50. As the journal owner, I want a dedicated start page, so that I can see today's status and recent history before choosing an action.
51. As the journal owner, I want a dedicated Morning Check-in page, so that the Breathing Exercise and questions are free from journal distractions.
52. As the journal owner, I want a dedicated Personal Journal page, so that I can browse all Daily Snapshots in one place.
53. As the journal owner, I want a dedicated Daily Snapshot detail page, so that I can focus on one past morning.
54. As the journal owner, I want navigation between start, Morning Check-in, Personal Journal and Daily Snapshot details, so that each activity has a predictable location.
55. As the journal owner, I want a direct visit to the Morning Check-in page to load today's state, so that navigation does not depend on previously visiting the start page.
56. As the journal owner, I want direct visits to an existing Daily Snapshot detail page to work, so that URLs remain useful after refresh.
57. As the journal owner, I want an understandable not-found state for an unknown Daily Snapshot, so that invalid links do not produce a technical failure.
58. As the journal owner, I want the same components and behavior in both migration phases, so that the multipage migration does not introduce a second implementation.
59. As the journal owner, I want the same visual language across every page, so that the application feels like one coherent product.
60. As the journal owner, I want the redesigned behavior covered by automated tests, so that later changes do not silently break the Morning Check-in or Personal Journal.

## Implementation Decisions

- The production frontend remains Next.js with TypeScript and React.
- The Lovable project remains a reference implementation. TanStack Start, its router, generated route tree and localStorage journal persistence are not introduced into the production frontend.
- FastAPI remains the only persistence boundary for Morning Check-ins and Daily Snapshots.
- The existing typed Personal Journal API client remains the frontend boundary for backend communication.
- Existing REST contracts for health, retrieving or creating today's Morning Check-in, saving responses, restarting, completing, listing Daily Snapshots and downloading the Journal Export remain unchanged.
- No backend schema migration is required for the redesign.
- The implementation is delivered in two sequential phases: a complete Ein-Seiten-Flow followed by a Mehrseiten-Flow.
- The first phase preserves the current top-level page and its state progression while extracting presentation into focused components.
- The first phase presents start, Breathing Exercise, questions, completed Daily Snapshot and Personal Journal within one rendered page.
- The Morning Check-in controller owns API communication, current state, response submission, completion and error handling. Visual components receive data and callbacks through props.
- The primary states remain start, breathing and questionnaire; a completed Morning Check-in is represented by the returned completed resource rather than a separate persistence model.
- The six established German questions and their backend numbering remain authoritative.
- The Lovable design's structured gratitude and task arrays are not adopted because the domain permits one optional free-text Check-in Response for questions two through six.
- Mood selection is presented as an accessible 1-5 control while continuing to submit an integer through the existing API.
- Each response is saved through the API before advancing to the next question.
- Existing resume, restart, Blank Check-in and immutable Daily Snapshot behavior is preserved.
- Backward question navigation is not added unless editing previously submitted responses is explicitly designed later.
- The Breathing Exercise remains client-side, skippable, unpersisted and configurable in tests.
- Daily Snapshot rendering adapts the existing API model into display data. It does not assume structured Coach Summary fields that the backend does not provide.
- The Coach Summary remains one optional string. The frontend does not parse it into mood, theme or recommendation fields.
- Recent mood values may be rendered as a lightweight client-side trend from the already loaded Daily Snapshots.
- The mood trend does not create stored analytics, aggregate backend endpoints or additional LLM input.
- The Journal Export remains available through the existing API operation.
- Design tokens define semantic colors, typography, radii, shadows, gradients and motion.
- Display and interface fonts are integrated through Next.js font loading to avoid client-side font dependencies.
- Responsive layout, keyboard interaction, visible focus states, semantic controls and reduced-motion support are required.
- In the second phase, the start page displays today's status, start or resume action, recent Daily Snapshots and mood trend.
- In the second phase, a dedicated Morning Check-in page owns the Breathing Exercise, question progression and completed Daily Snapshot presentation.
- In the second phase, a dedicated Personal Journal page displays all Daily Snapshots, mood trend, empty/error states and Journal Export.
- In the second phase, a dynamic detail page displays one Daily Snapshot.
- The initial detail page may resolve a snapshot from the existing newest-first list response. A dedicated detail endpoint is not required for this redesign.
- Shared Morning Check-in and Personal Journal behavior is extracted only where needed for use across pages. The design should prefer one high-level controller seam over numerous small state abstractions.
- Route transitions must not duplicate or replace persisted backend state. A direct page load reconstructs the required state from the API.
- Additional color themes and automatic mood-based theming may be added only after the core multipage flow is stable and must not store Personal Journal data in localStorage.
- The redesign must not expose database access or the Coach Summary Generator's credentials to the browser.

## Testing Decisions

- Tests assert externally observable behavior through rendered UI, accessible roles, labels, visible state and calls across the typed API boundary. They do not assert component internals, CSS class names or state-hook structure.
- The primary frontend test seam is the rendered Next.js experience supplied with a mocked Personal Journal API client.
- This single high-level seam covers both migration phases: initially the Ein-Seiten-Flow and subsequently each routed page.
- Existing API-client tests remain the separate contract seam for request URLs, methods, payloads, response parsing and client-visible backend errors.
- Existing Morning Check-in UI tests provide prior art for mocked API responses, browser-local dates, Breathing Exercise transitions, response saving, resume, restart, completion, Coach Summary rendering, history and Journal Export.
- Tests cover the new start presentation for new, unfinished and completed Morning Check-ins.
- Tests cover automatic and skipped completion of the Breathing Exercise.
- Tests cover accessible mood selection and integer submission.
- Tests cover optional free-text and blank Check-in Responses.
- Tests cover saving, disabled/loading presentation and visible API failures.
- Tests cover resuming and deliberately restarting an unfinished Morning Check-in.
- Tests cover completion after the sixth response and Blank Check-in completion.
- Tests cover Daily Snapshots with and without mood and Coach Summary.
- Tests cover newest-first Personal Journal rendering, empty state, loading failure and Journal Export.
- Tests cover the client-derived mood trend using available valid mood values.
- Multipage tests cover navigation from start to Morning Check-in, direct route loading, unfinished resume, completed presentation, Personal Journal navigation and Daily Snapshot detail resolution.
- Multipage tests cover the not-found presentation for an unknown Daily Snapshot identifier.
- Accessibility assertions prefer roles, names and labels so tests exercise the interface as a person or assistive technology would.
- Type checking, automated tests and the production build must pass after each migration phase.
- Browser-level visual review is required at representative mobile and desktop widths because typography, gradients, spacing and responsive composition are not sufficiently validated by DOM tests alone.

## Out of Scope

- Replacing Next.js with TanStack Start, Vite or another frontend framework.
- Deploying the Lovable project as a second production application.
- Moving Morning Check-ins or Daily Snapshots to localStorage.
- Changing the six Morning Check-in questions or introducing Lovable's structured three-item response fields.
- Changing FastAPI persistence, TinyDB or the Coach Summary Generator.
- Changing existing REST payloads or Coach Summary storage into a structured object.
- Editing or deleting completed Daily Snapshots.
- Adding a delete endpoint or deletion confirmation flow.
- Adding a dedicated Daily Snapshot detail endpoint in the initial redesign.
- Authentication, accounts, public access or multi-user behavior.
- Adaptive questions, follow-up questions or sending Personal Journal history to the Coach Summary Generator.
- Backend analytics, trend persistence or mood insights beyond the lightweight client-rendered trend.
- Changing the Journal Export format.
- Making the Breathing Exercise configurable by the journal owner or persisting its completion.
- LLM retry controls or technical LLM failure details.
- Theme selection as a prerequisite for either core migration phase.
- Visual regression infrastructure unless separately requested.

## Further Notes

- The existing Morning Coach MVP specification remains authoritative for domain behavior, privacy boundaries and API semantics. This specification changes frontend presentation and page organization only.
- The Lovable design's visual system, breathing presentation, focused question cards, snapshot cards and journal cards should guide the implementation.
- Lovable-specific data behavior must not override the established definitions of Morning Check-in, Check-in Response, Daily Snapshot, Personal Journal, Coach Summary, Journal Export or Breathing Exercise.
- Phase one should be considered complete and stable before route extraction begins.
- Phase two must reuse phase-one components and controller behavior rather than rebuild the experience.
