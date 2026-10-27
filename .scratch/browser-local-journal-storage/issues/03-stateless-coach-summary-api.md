# 03 — Stateless Coach Summary API

**What to build:** The backend provides a small, stateless interface for optional Coach Summary generation. It does not store check-ins or journal data. The API processes only the current answers and target language; the OpenAI key remains exclusively in the backend environment.

**Blocked by:** 01 — Documentation and Manual Migration Runbook

**Status:** ready-for-agent

- [ ] Define a clear HTTP contract for Coach Summary generation with current answers and target language as the only domain inputs.
- [ ] The backend process creates neither a TinyDB instance nor a journal file at startup.
- [ ] Load `OPENAI_API_KEY` exclusively from the backend environment; never expose it in client configuration, response data, or browser storage.
- [ ] The backend contract returns successful summary text or a controlled unavailable/empty result.
- [ ] Preserve the existing language detection and supportive, non-clinical summary rules.
- [ ] Requests contain no Personal Journal history, User Profile, PIN, Security Challenge, or user identity.
- [ ] Health Check and CORS behavior for frontend access remain functional.
- [ ] Backend tests verify the HTTP contract, key configuration, input validation, language forwarding, and controlled generator failures using fake generators without calling OpenAI.
