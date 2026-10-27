# 03 — App entry routing + Onboarding

**What to build:** The root route becomes the gatekeeper for the whole application. On mount it reads from the `UserProfileStore` and branches: no profile → Onboarding flow; profile exists but no active session → a stub Lock Screen (a minimal placeholder that will be replaced in ticket 04); active session → existing Home page. Active session state is held in React state or context — not in `localStorage` — so it resets on page refresh and the user is returned to the Lock Screen.

The Onboarding flow is fully built in this ticket. It consists of three steps shown on a single screen: (1) a short app description and privacy notice, which explicitly mentions that answers are sent anonymously to OpenAI for the Coach Summary and that this can be disabled in Settings; (2) a Name and PIN input form; (3) a user-defined Security Challenge question and answer form. On successful submission the User Profile is saved via `UserProfileStore`, the active session is established, and the user lands on the Home page without passing through a Lock Screen.

The `UserProfileStore` is injected as a prop to the root page component (defaulting to the concrete `localStorage` implementation) so tests can supply a mock.

Tests use a mock `UserProfileStore`. Journey test: mock store returns null → Onboarding renders → user fills in name, PIN, and Security Challenge → Home page renders with active session.

**Blocked by:** 01 — `UserProfileStore` abstraction.

**Status:** ready-for-agent

- [ ] Root route reads `UserProfileStore` on mount and branches into three states
- [ ] No profile stored → Onboarding flow renders
- [ ] Profile stored, no active session → stub Lock Screen renders (placeholder text sufficient)
- [ ] Active session → existing Home page renders unchanged
- [ ] Active session is held in React state, not `localStorage`; page refresh returns to stub Lock Screen
- [ ] Onboarding step 1 shows app description and privacy notice (including Coach Summary opt-out mention)
- [ ] Onboarding step 2 shows Name and PIN input fields
- [ ] Onboarding step 3 shows user-defined Security Challenge question and answer fields
- [ ] Completing Onboarding saves the User Profile via `UserProfileStore`
- [ ] After Onboarding the user lands on the Home page with an active session (no Lock Screen interstitial)
- [ ] Onboarding does not render again on subsequent visits once a profile is stored
- [ ] Journey test: no profile → Onboarding → setup complete → Home page shown
