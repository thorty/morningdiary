# User Profile as client-side soft gate, not server-side authentication

The app is a private, self-hosted personal journal designed for single-device use where each family member logs into the OS with their own account. Each OS user therefore has their own browser profile and `localStorage`, which already provides natural data isolation. To prevent a casual family member from reading the journal when they borrow an unlocked device, a User Profile (name + PIN + Security Challenge) is stored in `localStorage` and gates access to the journal on the Lock Screen.

We deliberately chose not to implement server-side authentication. The app has no user accounts, no session tokens, and no server-side identity. The PIN lives in `localStorage` unencrypted and is trivially readable via DevTools. This is an accepted trade-off: the threat model is casual access by an honest family member, not a determined attacker. Introducing proper server-side auth would require multi-user backend data isolation, token management, and a significantly more complex architecture — none of which is warranted for an MVP running on a private LAN.

## Considered Options

- **Server-side authentication with per-user TinyDB tables** — rejected; over-engineered for the single-household use case and would require backend changes to every API endpoint.
- **No gating at all** — rejected; anyone who opens the URL would immediately see the journal, which felt unacceptable even for a private network.
- **Client-side soft gate (chosen)** — fits the MVP scope, keeps the backend identity-free, and matches the real threat model.
