# 01 — `UserProfileStore` abstraction

**What to build:** A thin abstraction over `localStorage` for User Profile data. This is a prefactor — no UI changes, just the interface and its concrete implementation that all User Profile components will depend on.

The `UserProfileStore` interface exposes three operations: load (returns the stored User Profile or null if none exists), save (persists a User Profile), and clear (removes the stored profile). The concrete implementation reads and writes a single namespaced key in `localStorage`. A User Profile holds: name (string), PIN (string), Security Challenge question (string), and Security Challenge answer (string).

Unit tests cover the concrete implementation: saving a profile and loading it back returns the correct data; loading when nothing is stored returns null; clearing removes the profile so a subsequent load returns null.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `UserProfileStore` interface defined with `load`, `save`, and `clear` operations
- [ ] `UserProfile` type defined with name, PIN, Security Challenge question, and Security Challenge answer fields
- [ ] Concrete `localStorage` implementation of `UserProfileStore` created
- [ ] Save → load round-trip returns the correct profile
- [ ] Load when nothing is stored returns null
- [ ] Clear removes the profile so a subsequent load returns null
