Status: ready-for-agent

# Backend Logging for Morning Coach

## Problem Statement

As the journal owner and operator of this self-hosted app, I cannot reliably see what the backend is doing when Morning Check-ins are processed, when Daily Snapshots are completed, or when Coach Summary generation succeeds or fails. In particular, I have little visibility into the Coach Summary Generator interaction, including what is sent to OpenAI and where failures occur. This makes troubleshooting and confidence in runtime behavior harder than it should be.

## Solution

Add structured backend logging that writes to terminal output and covers key lifecycle events with `info` and `error` levels. Logging should focus on high-value operational moments: API request handling milestones, Morning Check-in completion, Coach Summary generation attempts, the payload context sent to OpenAI (bounded and safe), and fallback behavior when generation fails. The feature should preserve existing product behavior: Daily Snapshot completion must remain resilient, and logging must not change user-facing flows.

## User Stories

1. As the journal owner, I want backend logs in the terminal, so that I can observe runtime behavior without extra tooling.
2. As the journal owner, I want `info` logs for normal processing, so that I can follow successful Morning Check-in and Daily Snapshot flow.
3. As the journal owner, I want `error` logs for failures, so that I can quickly diagnose issues.
4. As the journal owner, I want a log entry when the backend starts, so that I can confirm service availability.
5. As the journal owner, I want a log entry when a Morning Check-in is created or resumed, so that I can trace daily routine state.
6. As the journal owner, I want a log entry when a Morning Check-in is completed, so that I can verify Daily Snapshot creation timing.
7. As the journal owner, I want a log entry when a Blank Check-in completes, so that I can verify no Coach Summary generation was attempted.
8. As the journal owner, I want a log entry when Coach Summary generation begins, so that I can see when the backend invokes the generator.
9. As the journal owner, I want logs to indicate the target summary language, so that I can verify language-selection behavior.
10. As the journal owner, I want logs to show what answer context is being sent to OpenAI, so that I can validate the boundary of sent data.
11. As the journal owner, I want logs to confirm that only current Morning Check-in answers are used, so that I can trust the Personal Journal privacy boundary.
12. As the journal owner, I want logs to avoid leaking secrets such as API keys, so that observability does not reduce security.
13. As the journal owner, I want logs to avoid exposing unrelated metadata, so that only necessary generation context is visible.
14. As the journal owner, I want a clear `info` log when Coach Summary generation succeeds, so that I can verify healthy OpenAI integration.
15. As the journal owner, I want a clear `error` log when Coach Summary generation throws an exception, so that I can diagnose outages or integration errors.
16. As the journal owner, I want a clear `error` log when generation returns empty output, so that I can distinguish empty-result failures from successful summaries.
17. As the journal owner, I want a log entry when fallback summary text is stored, so that I can trace resilience behavior.
18. As the journal owner, I want logging to preserve existing API responses, so that frontend behavior remains unchanged.
19. As the journal owner, I want logging to preserve completion semantics, so that Daily Snapshot persistence remains independent of OpenAI success.
20. As the journal owner, I want logs for completion idempotency paths, so that repeated completion calls are understandable.
21. As the journal owner, I want logs to include stable identifiers like check-in id and browser date where available, so that I can correlate events.
22. As the journal owner, I want consistent message formats, so that terminal scanning is fast and predictable.
23. As the journal owner, I want the logger configuration to be simple and backend-native, so that maintenance stays lightweight.
24. As the journal owner, I want this first iteration to run without external log infrastructure, so that setup remains minimal.
25. As the journal owner, I want tests to lock in the critical logging behavior, so that future changes do not silently remove observability.
26. As the journal owner, I want logs to stay focused on operational events rather than every internal step, so that noise remains manageable.
27. As the journal owner, I want this logging feature to apply across the existing Morning Check-in to Daily Snapshot flow, so that the most important journaling behavior is observable end to end.

## Implementation Decisions

- Introduce a backend logging policy centered on two levels for MVP observability: `info` for successful lifecycle events and `error` for failure and fallback paths.
- Use the backend’s existing runtime boundary as the primary instrumentation seam: HTTP endpoint handlers that orchestrate Morning Check-in and Daily Snapshot behavior.
- Use the existing Coach Summary Generator boundary as the secondary instrumentation point for generation-specific events, avoiding new domain seams.
- Log the Coach Summary generation attempt with structured context including check-in identity, target language, and the current Morning Check-in answers payload that is being sent for generation.
- Keep the logged payload bounded to current-answer context only, matching existing domain rules that exclude Personal Journal history and unrelated metadata.
- Explicitly prohibit logging of secrets and credentials, including backend environment values such as API keys.
- Preserve current product behavior: logging is observational only and must not alter completion rules, fallback behavior, language detection, or API contracts.
- Ensure generation failure paths emit `error` logs with actionable context while still allowing Daily Snapshot completion and fallback-note persistence.
- Emit `info` logs for major successful milestones: check-in retrieval/creation, completion, generation success, and fallback application when used intentionally.
- Keep logging output terminal-first for this phase; no log aggregation backend, retention policy, or dedicated sink configuration is introduced.
- Favor consistent structured fields across messages so operators can correlate one Morning Check-in flow across multiple log lines.

## Testing Decisions

- Good tests validate externally observable behavior and contract safety first; logging assertions are used only where they verify required observability outcomes rather than implementation trivia.
- Keep the highest existing seam as the primary test surface: backend HTTP API integration tests that exercise real flow outcomes for Morning Check-in completion and Daily Snapshot persistence.
- Add focused backend tests that capture logs during key scenarios and assert required `info`/`error` entries exist with expected contextual fields.
- Cover scenarios for: successful Coach Summary generation, generator exception, empty generation output, Blank Check-in completion with no generator call, and already-completed idempotent completion path.
- Reuse existing deterministic backend testing style with temporary TinyDB storage and fake Coach Summary Generator behavior; avoid real OpenAI calls.
- Prior art comes from the current backend API test suite that already validates completion resilience, fallback summary behavior, no-generator behavior for Blank Check-in, and language selection rules; logging tests should follow the same scenario design.

## Out of Scope

- No centralized logging platform, shipping logs to external systems, or observability dashboards.
- No persistent log files, rotation strategy, or long-term retention policy in this iteration.
- No debug-level tracing of every function call or internal helper.
- No changes to frontend UI for log visibility.
- No changes to domain behavior of Morning Check-in, Daily Snapshot, Personal Journal, Coach Summary content rules, or fallback text.
- No redesign of Coach Summary Generator interface beyond what is needed to instrument current events.

## Further Notes

- This feature is operational and diagnostic in scope; it is not a product-facing behavior change.
- The implementation should keep logs readable for manual terminal use while still being structured enough for future extension.
- If future needs grow, this logging baseline can become the foundation for metrics, trace correlation, or external log sinks without revisiting domain contracts.
