# Interaktive Atemkugel

**Status:** ready-for-agent

## Problem Statement

Während der Breathing Exercise zeigt die Anwendung eine automatisch skalierende Atemkugel. Der Journal Owner kann ihre Größe nicht selbst beeinflussen und hat daher keine aktive, körperliche Interaktion, die den viersekündigen Einatem- und sechssekündigen Ausatemrhythmus begleitet. Die Kugel soll außerdem in jeder Farbstimmung eindeutig zum gerade aktiven Farbschema gehören.

## Solution

Die Breathing Exercise erhält eine interaktive p5.js-Canvas-Animation. Bewegt der Journal Owner den Mauszeiger über die Canvas, verändert die Summe aus horizontaler und vertikaler Zeigerposition den Durchmesser des mittig gezeichneten Kreises entsprechend der gelieferten p5.js-Vorlage. Der Kreis liest seine Füllfarbe aus den vorhandenen CSS-Farbvariablen und passt sich dadurch unmittelbar an die aktive Farbstimmung Orange, Blau, Lila oder Grün an. Countdown, deutsche Atemhinweise, Überspringen und der automatische Übergang zur ersten Frage bleiben unverändert erhalten.

## User Stories

1. As a Journal Owner, I want to make the p5.js breathing circle larger or smaller with mouse movement during the Breathing Exercise, so that I can actively accompany my breathing.
2. As a Journal Owner, I want the orb to react continuously while I move the mouse in its interaction area, so that the exercise feels direct and responsive.
4. As a Journal Owner, I want the orb to use the currently active color scheme, so that Orange, Blau, Lila, and Grün remain visually consistent throughout the Morning Check-in.
5. As a Journal Owner, I want an automatically resolved color scheme to affect the breathing orb as well, so that my most recent Daily Snapshot's mood-based Farbstimmung is reflected consistently.
6. As a Journal Owner, I want a manually selected color scheme to affect the breathing orb as well, so that my chosen Farbstimmung is respected.
7. As a Journal Owner, I want the fixed German cues for four seconds Einatmen and six seconds Ausatmen to remain visible, so that the interactive visualization does not change the established breathing rhythm.
8. As a Journal Owner, I want the 30-second countdown and progress indicator to remain accurate while using the orb, so that I know when the first Morning Check-in question will open.
9. As a Journal Owner, I want to skip the Breathing Exercise while the interactive orb is shown, so that I can continue directly to the first question when I am short on time.
10. As a Journal Owner, I want the first Morning Check-in question to open automatically when the Breathing Exercise ends, so that interacting with the orb does not interrupt the routine.
11. As a Journal Owner, I want the interaction to work with touch input where a touch-capable browser exposes pointer events, so that the exercise remains usable without a mouse.
12. As a Journal Owner who prefers reduced motion, I want the Breathing Exercise to continue respecting the application's reduced-motion styling, so that the new interaction does not force motion discomfort.
13. As a Journal Owner, I want the Breathing Exercise to remain unpersisted, so that it continues to be only a visual prelude and does not alter my Daily Snapshot.

## Implementation Decisions

- Modify the existing client-side Breathing Exercise presentation owned by the Morning Check-in UI and add p5.js as its canvas runtime.
- Implement the supplied p5.js sketch in a client-only component. It creates a 720 by 400 canvas, clears it to black, maps `mouseY + mouseX` from zero to canvas height onto a 20-to-300 diameter, and draws one centered circle each frame.
- Load p5.js dynamically after mounting so the server-rendered Next.js route does not evaluate browser-only canvas code. Remove the p5.js sketch when the Breathing Exercise unmounts.
- Read the active primary CSS color from the document root during drawing and use it as the p5.js circle fill. The existing global `data-theme` application remains the sole source of the active Orange, Blau, Lila, or Grün Farbstimmung.
- Retain countdown timing, skip action, automatic completion, German copy, and non-persistence of the Breathing Exercise. The replaced native orb no longer provides a separate progress ring.
- When the browser requests reduced motion, do not run p5.js's continuous draw loop. Draw the initial canvas and redraw only after pointer movement.
- Do not introduce a theme prop, a new API contract, storage, or server-side behavior for the interactivity.
- Preserve reduced-motion behavior. The pointer-controlled size must not require a looping animation; existing reduced-motion rules remain effective for any retained visual transitions.

## Testing Decisions

- Test externally observable behavior through the existing Morning Check-in UI seam, with its mocked Personal Journal API client. Do not test React state, CSS implementation details, or individual event-handler internals.
- Add a focused UI test that starts the Breathing Exercise and verifies that the interactive p5.js animation region is present. Canvas drawing itself is covered by the supplied, direct p5.js mapping contract rather than implementation-detail tests in jsdom.
- Add a UI test that verifies the Breathing Exercise remains skippable and still reaches the first question, preserving the current journey behavior while the interactive orb is present.
- Retain existing tests for theme selection and automatic theme resolution, which establish the active `data-theme` contract consumed by the canvas at draw time. Canvas pixel output is not asserted in jsdom. Retain the existing check-in journey test as prior art for mocked API clients and skip-to-question behavior.

## Out of Scope

- Adding another graphics library beyond p5.js.
- Changing the 30-second duration, the four-second Einatmen/six-second Ausatmen rhythm, the German copy, the countdown, or the progress ring.
- Persisting interaction data, Breathing Exercise completion, or the selected orb size in a Morning Check-in or Daily Snapshot.
- Adding configurable breathing patterns, user-configurable orb sizes, audio, haptics, scores, achievements, or analytics.
- Redesigning the theme picker or adding further Farbstimmungen.
- Altering the separate LovableDesign reference application.

## Further Notes

- The productive frontend already defines and applies the four relevant Farbstimmungen independently of the LovableDesign reference application.
- The established domain term is Breathing Exercise: a skippable, unsaved visual prelude to a Morning Check-in. The interactive orb is a visualization within that exercise, not a new persisted domain concept.
