# Journal-Konfiguration

**Status:** ready-for-agent

## Problem Statement

Der Journal Owner kann weder die automatische Coach Summary für neue Daily Snapshots lokal deaktivieren noch die gesamte Personal-Journal-Historie samt angefangenen Morning Check-ins zurücksetzen. Die Konfiguration soll ohne eigene Seite schnell erreichbar und bewusst einfach bleiben.

## Solution

Die Seitennavigation erhält ein einklappbares Konfigurationsmenü. Es enthält einen lokal gespeicherten Schalter, der steuert, ob künftig abgeschlossene Morning Check-ins eine Coach Summary anfordern, sowie eine Aktion zum unwiderruflichen Löschen der gesamten Personal-Journal-Historie einschließlich unfertiger Morning Check-ins. Eine native Browser-Bestätigung schützt vor versehentlichem Löschen.

Der OpenAI-API-Key bleibt ausschließlich serverseitig in `backend/.env`; er wird nicht im Frontend gespeichert oder angezeigt.

## User Stories

1. As a Journal Owner, I want to open and close a small configuration menu from the navigation, so that settings do not require a separate page.
2. As a Journal Owner, I want Coach Summaries to be enabled by default, so that the existing behavior remains unchanged until I opt out.
3. As a Journal Owner, I want to disable Coach Summaries, so that future Daily Snapshots are completed without an OpenAI request.
4. As a Journal Owner, I want to enable Coach Summaries again, so that future Daily Snapshots can receive supportive reflections.
5. As a Journal Owner, I want my Coach Summary preference to survive browser reloads, so that I do not need to set it repeatedly.
6. As a Journal Owner, I want existing Coach Summaries to remain visible after disabling future generation, so that past Daily Snapshots are not changed.
7. As a Journal Owner, I want to delete the complete Personal Journal history, so that I can reset the application.
8. As a Journal Owner, I want deletion to include unfinished Morning Check-ins, so that no partial routine is resumed after the reset.
9. As a Journal Owner, I want a native browser confirmation before deletion, so that accidental data loss is less likely.
10. As a Journal Owner, I want a cancelled deletion confirmation to leave all data unchanged, so that I can safely back out.

## Implementation Decisions

- Add a compact, expandable configuration control to the existing navigation rather than creating a dedicated configuration route.
- Use browser-local storage for whether future Coach Summary generation is enabled. An absent, invalid, or inaccessible value means enabled.
- Do not store, display, transmit, or modify the OpenAI API key in the frontend. The existing server-side environment configuration remains the only source of the key.
- Extend Morning Check-in completion so the frontend can opt out of Coach Summary generation for that completion. A disabled Summary leaves the Daily Snapshot complete without invoking the Coach Summary Generator.
- Add one Personal-Journal-wide deletion operation that removes every persisted Morning Check-in record, regardless of whether it is unfinished or completed.
- Invoke deletion only after `window.confirm` returns true, then clear visible frontend state.
- Keep the Stimmungsverlauf and removal of the optional free-text response label out of scope.

## Testing Decisions

- Test externally observable behavior through the existing page-level React seam with injected Personal Journal API clients.
- Test the backend through HTTP endpoints for Summary opt-out and Journal-wide deletion.
- Verify menu visibility, persisted Summary preference, confirmation cancellation, confirmed deletion, and cleared UI state.
- Use existing mocked API-client frontend tests and backend API tests as prior art.

## Out of Scope

- A standalone configuration page.
- Editing or storing the OpenAI API key in the browser.
- Per-snapshot deletion, restoration, undo, or archival.
- Changing existing Coach Summaries.
- Changing the Stimmungsverlauf.
- Visual redesign beyond the compact configuration menu.

## Further Notes

- The established domain terms Morning Check-in, Daily Snapshot, Personal Journal, and Coach Summary are used throughout.
- Deletion is irreversible and applies to the entire Personal Journal, including an unfinished current-day Morning Check-in.
