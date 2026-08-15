# 04 — Lock Screen + logout

**What to build:** Replace the stub Lock Screen from ticket 03 with the real implementation, and add a logout action to the existing configuration menu.

The Lock Screen displays "Willkommen zurück, {name}" using the name stored in the User Profile, a PIN input field, and a submit button. On correct PIN entry the active session is established and the user is taken to the Home page. On incorrect PIN an inline error message is shown; the input is cleared and the user can try again. The Lock Screen also contains a PIN Reset trigger (a link or button) — its behaviour is implemented in ticket 05; for now the trigger can be a visible placeholder.

The logout action is added to the existing configuration menu. Triggering it clears the active session state, which causes the root route to render the Lock Screen. The User Profile remains in `localStorage` — logout does not delete anything.

Tests use a mock `UserProfileStore`. Tests cover: Lock Screen renders with the stored name; correct PIN activates the session and the Home page renders; incorrect PIN shows an error; logout from the Home page renders the Lock Screen; after logout, re-entering the correct PIN shows the Home page again. The existing check-in journey test is extended to include the logout → Lock Screen → login segment.

**Blocked by:** 03 — App entry routing + Onboarding.

**Status:** ready-for-agent

- [ ] Stub Lock Screen from ticket 03 is replaced with the full implementation
- [ ] Lock Screen displays "Willkommen zurück, {name}" using the stored name
- [ ] Lock Screen has a PIN input field and a submit button
- [ ] Correct PIN activates the session and navigates to the Home page
- [ ] Incorrect PIN shows an inline error message and clears the input
- [ ] Lock Screen contains a visible PIN Reset trigger (behaviour implemented in ticket 05)
- [ ] Logout action added to the existing configuration menu
- [ ] Logout clears the active session and immediately renders the Lock Screen
- [ ] Logout leaves the User Profile in `localStorage` intact
- [ ] Page refresh while on the Home page returns to the Lock Screen
- [ ] Journey test extended: active session → logout → Lock Screen → correct PIN → Home page
