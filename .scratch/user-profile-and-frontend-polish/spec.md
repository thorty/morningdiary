Status: ready-for-agent

# User Profile, Mood Scale, and Frontend Polish

## Problem Statement

The app currently has no concept of who is using it. Anyone who opens the URL on a shared device sees the Personal Journal immediately — there is no barrier between a family member picking up an unlocked laptop and reading someone else's private morning reflections. Beyond identity, the mood capture UI renders emoji as Unicode escape sequences rather than real emoji characters, the Mood Trend is a basic polyline sparkline with no time axis or readable y-axis labels, and the layout is not optimised for HD screens.

## Solution

Introduce a User Profile — a name, PIN, and Security Challenge stored in `localStorage` — that gates access to the Personal Journal via a Lock Screen. First-time users complete a one-time Onboarding flow. Returning users see a Lock Screen with a welcome-back greeting and PIN input. A PIN Reset flow lets users recover access by answering their Security Challenge, leaving journal data untouched. Separately, the mood UI is updated to use the canonical Mood Scale emojis throughout, the Mood Trend is replaced with a proper time-series line chart (time x-axis, emoji y-axis, max 14 days, dynamic tick step), and the layout is tightened for HD screens.

## User Stories

### User Profile — Onboarding

1. As a first-time journal user, I want to see a short description of the app before I set up my profile, so that I understand what I am committing to.
2. As a first-time journal user, I want to see a clear privacy notice during onboarding stating that my data is stored locally and that answers are sent anonymously to OpenAI for the Coach Summary, so that I can make an informed decision before entering anything personal.
3. As a first-time journal user, I want to know that I can disable the OpenAI Coach Summary in Settings, so that I am aware of the opt-out before I start.
4. As a first-time journal user, I want to enter my name during onboarding, so that the app can greet me personally.
5. As a first-time journal user, I want to choose a PIN during onboarding, so that my journal is protected from casual access on a shared device.
6. As a first-time journal user, I want to write my own Security Challenge question and answer during onboarding, so that I have a recovery path if I forget my PIN.
7. As a first-time journal user, I want Onboarding to be shown exactly once, so that I am not asked to set up my profile again after it is complete.
8. As a first-time journal user, I want to be taken directly to my journal after completing Onboarding, so that I can start my Morning Check-in without having to log in again.

### User Profile — Lock Screen

9. As a returning journal user, I want to see my name with a welcome-back greeting on the Lock Screen, so that I know the app recognises my profile.
10. As a returning journal user, I want to enter my PIN on the Lock Screen to access my journal, so that my reflections are protected from casual access.
11. As a returning journal user who enters the correct PIN, I want to be taken immediately to the Home page, so that I can start my morning routine without friction.
12. As a returning journal user who enters the wrong PIN, I want to see an error message, so that I know to try again.
13. As a returning journal user, I want the Lock Screen to appear automatically when I refresh the page or open a new browser tab, so that the protection is consistent.

### User Profile — Logout

14. As a journal user, I want a logout button accessible from Settings, so that I can lock the app before handing a device to someone else.
15. As a journal user who logs out, I want to be taken to the Lock Screen immediately, so that my journal is protected without delay.
16. As a journal user who logs out, I want my User Profile to remain in `localStorage`, so that I can log back in without repeating Onboarding.

### User Profile — PIN Reset

17. As a journal user who has forgotten their PIN, I want a PIN Reset trigger on the Lock Screen, so that I can recover access without losing my journal.
18. As a journal user triggering a PIN Reset, I want to see the Security Challenge question I set during Onboarding, so that I know what question to answer.
19. As a journal user who answers the Security Challenge correctly, I want to be prompted to set a new PIN, so that I can regain access.
20. As a journal user who sets a new PIN after a successful Security Challenge, I want to be taken directly to the Home page, so that I can continue using the app.
21. As a journal user who answers the Security Challenge incorrectly, I want to see an error message, so that I know my answer was wrong and can try again.
22. As a journal user completing a PIN Reset, I want my name, Security Challenge, and all journal data to remain untouched, so that only the PIN changes.

### Mood Scale

23. As a journal user on the mood capture step, I want to see emoji faces instead of numbers or Unicode escape sequences, so that selecting my mood feels intuitive and expressive.
24. As a journal user viewing a Daily Snapshot, I want to see the Mood Scale emoji for the recorded mood, so that the mood is immediately readable.
25. As a journal user looking at the Mood Trend, I want the y-axis to show Mood Scale emojis at each level, so that the chart is readable without a numeric legend.
26. As a journal user, I want the same five emojis used consistently on every surface that displays mood, so that the vocabulary is coherent throughout the app.

### Mood Trend

27. As a journal user, I want to see my mood history as a line chart with calendar dates on the x-axis, so that I can see how my mood changes over time.
28. As a journal user, I want the Mood Trend to cover at most the last 14 days, so that I see recent and relevant history without clutter.
29. As a journal user with many entries, I want the time axis to widen its tick step automatically when labels would overlap, so that the chart stays readable regardless of how many entries I have.
30. As a journal user with only a few entries, I want the time axis to show individual days, so that all available detail is visible.
31. As a journal user, I want the updated Mood Trend to appear on both the Home page and the Journal page, so that I have access to the chart wherever I am.
32. As a journal user who has no mood data in the last 14 days, I want the Mood Trend to not render, so that an empty chart is not shown.

### UI Polish

33. As a journal user answering a free-text Check-in question, I want the "Optionale Freitext Antwort" heading removed, so that the interface is cleaner and less redundant.
34. As a journal user on an HD screen (1920×1080), I want the entire Morning Check-in flow to fit on one screen without scrolling, so that I can complete my routine efficiently.

## Implementation Decisions

### User Profile storage

The User Profile is stored in `localStorage` under a single namespaced key. It contains: name (string), PIN (string), Security Challenge question (string), and Security Challenge answer (string). There is exactly one User Profile per browser profile. No server-side identity is introduced (see ADR-0001).

### `UserProfileStore` interface

A new `UserProfileStore` interface abstracts all `localStorage` access for the User Profile. It exposes three operations: load (returns the stored profile or null), save (persists a profile), and clear (removes the profile). All components that depend on User Profile data receive a `UserProfileStore` instance as a prop, defaulting to the concrete `localStorage` implementation. This is the single new testing seam for the entire User Profile feature.

### App entry flow

The root route checks the `UserProfileStore` on mount:
- **No profile** → render the Onboarding flow.
- **Profile exists, no active session** → render the Lock Screen.
- **Profile exists, active session** → render the normal Home page.

"Active session" is held in React state or context — not in `localStorage`. It resets on page refresh, which returns the user to the Lock Screen (consistent with the soft-gatekeeping model from ADR-0001).

### Onboarding flow

A single screen with three sequential sections: (1) app description and privacy notice with an explicit mention of the OpenAI opt-out available in Settings; (2) Name and PIN input; (3) user-defined Security Challenge question and answer. On submission the User Profile is saved and the user enters the app with an active session (no Lock Screen on first entry).

### Lock Screen

Displays "Willkommen zurück, {name}" and a PIN input field. Includes a PIN Reset trigger. On correct PIN the session is activated and the user is taken to the Home page. On incorrect PIN an inline error is shown.

### PIN Reset flow

Triggered from the Lock Screen. Step 1: display the stored Security Challenge question with an answer input. On incorrect answer show an error (case-insensitive comparison). On correct answer proceed to Step 2: new PIN input. On submission the new PIN is saved to the `UserProfileStore` and the session is activated.

### Logout

A logout action is added to the existing configuration menu. It clears the active session state, which causes the app to render the Lock Screen. The User Profile remains in `localStorage`.

### Mood Scale

A pure function `emojiForMood(mood)` is added to the existing mood utility module. The canonical mapping is: 1→😞, 2→😐, 3→🙂, 4→😊, 5→😄. Every surface that renders a mood value calls this function — the mood capture form, the Daily Snapshot display, and the Mood Trend y-axis.

### Mood Trend replacement

The existing Mood Trend component is replaced in-place on every surface where it currently appears. The new component accepts the same input (array of Daily Snapshots). It filters to entries from the last 14 calendar days that contain a valid mood, then renders a line chart using inline SVG (no external charting library, consistent with the existing approach). The x-axis shows calendar dates; the tick step starts at 1 day and widens until labels no longer overlap. The y-axis shows Mood Scale emojis at all five levels. The minimum data threshold (currently 2 entries) is preserved.

### UI cleanup

The "Optionale Freitext Antwort" heading is removed from the free-text question component. CSS spacing, padding, and font sizes are adjusted so the Morning Check-in flow fits within a 1920×1080 viewport without scrolling.

### Security Challenge answer comparison

Answer matching is case-insensitive to reduce the risk of lockout due to capitalisation differences.

## Testing Decisions

Good tests only assert external behaviour — what a user sees and can do — not implementation details such as which `localStorage` key is written or which React state variable holds the PIN.

### `UserProfileStore` mock injection

All User Profile components are tested by injecting a mock `UserProfileStore`. Tests cover: Onboarding renders when the store returns null; Lock Screen renders when the store returns a profile; correct PIN activates the session; incorrect PIN shows an error; PIN Reset displays the stored Security Challenge question; correct Security Challenge answer advances to new PIN input; incorrect answer shows an error; new PIN is saved and the session is activated; logout clears the session and shows the Lock Screen.

### `emojiForMood()` unit tests

The five mood values are each asserted to return the correct emoji. These are pure function unit tests with no rendering.

### Mood Trend component tests

React Testing Library tests render the component with various snapshot arrays and assert: correct emoji labels appear on the y-axis; entries older than 14 days are excluded; fewer than 2 valid mood entries causes the component not to render; all five emoji levels are present as y-axis ticks.

### Journey test extension

The existing check-in journey test is extended to cover the new entry flow: no User Profile present → Onboarding renders → user completes setup → Home page is shown with active session → user logs out → Lock Screen renders → user enters correct PIN → Home page is shown again.

### Prior art

- Journey integration tests: `checkin-journey.test.tsx`
- HTTP client unit tests: `api-client.test.ts`
- Component rendering: existing React Testing Library tests throughout the frontend

## Out of Scope

- Encrypted or hashed PIN storage — the threat model is casual access by honest family members, not attackers with DevTools (ADR-0001)
- PIN complexity requirements (minimum length, allowed characters)
- Multiple User Profiles in one browser profile
- Changing the name or Security Challenge after Onboarding (a future Settings enhancement)
- Backend changes — the backend remains fully identity-free; no user identifier is added to any API call or persisted journal data.
- Multi-user data isolation at the backend level — OS-level browser profile separation is relied upon for that (ADR-0001)
- User Profile deletion independent of journal deletion
- Server-side session management or token-based authentication
- Adaptive or configurable Mood Scale emojis

## Further Notes

- The existing `morning-coach.coach-summary-enabled` `localStorage` key is preserved unchanged; the Onboarding privacy notice links conceptually to this setting but does not replace it.
- The coach-summary opt-out should be surfaced in the Onboarding privacy notice as a discoverable entry point, even though it is already configurable in Settings.
- The Mood Trend's dynamic tick step is a rendering concern: it should be calculated from the rendered label widths, not from a fixed data-count threshold.
