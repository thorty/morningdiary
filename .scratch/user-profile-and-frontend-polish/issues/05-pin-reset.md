# 05 — PIN Reset

**What to build:** Wire up the PIN Reset trigger that was added as a placeholder in ticket 04. The full flow runs in two steps, both displayed inline on the Lock Screen (no separate page needed).

Step 1 — Security Challenge: the user's stored Security Challenge question is displayed with an answer input field and a submit button. Answer comparison is case-insensitive. On incorrect answer an inline error is shown and the user can try again. On correct answer the view advances to step 2.

Step 2 — New PIN: a new PIN input field is shown with a submit button. On submission the new PIN is saved to the `UserProfileStore` (name and Security Challenge are untouched), the active session is established, and the user is taken to the Home page.

Tests use a mock `UserProfileStore` pre-loaded with a User Profile. Tests cover: PIN Reset trigger renders on the Lock Screen; clicking it shows the Security Challenge question; incorrect answer shows an error; correct answer shows the new PIN input; submitting a new PIN saves only the PIN field in the store, leaves name and Security Challenge unchanged, and navigates to the Home page.

**Blocked by:** 04 — Lock Screen + logout.

**Status:** ready-for-agent

- [ ] Clicking the PIN Reset trigger on the Lock Screen shows the Security Challenge question
- [ ] The displayed question matches the question stored in the User Profile
- [ ] Incorrect Security Challenge answer shows an inline error; input is cleared
- [ ] Answer comparison is case-insensitive
- [ ] Correct Security Challenge answer advances to the new PIN input step
- [ ] Submitting a new PIN saves the updated PIN to the `UserProfileStore`
- [ ] Name and Security Challenge question and answer are unchanged after PIN Reset
- [ ] After PIN Reset the active session is established and the Home page renders
- [ ] Journey test: Lock Screen → PIN Reset trigger → Security Challenge → correct answer → new PIN → Home page
