# Morning Coach Frontend

Next.js frontend for the Morning Coach Personal Journal.

The Personal Journal Store is the production persistence boundary. It stores unfinished Morning Check-ins and completed Daily Snapshots in a versioned, namespaced `localStorage` document for the current browser profile. The frontend does not use backend journal CRUD, history, export, or delete endpoints. The stateless backend is contacted only for the optional Coach Summary and Health Check.

Browser-local storage is device- and browser-profile-specific. It is not synchronization, encryption, or authentication. Existing TinyDB deployments must follow `docs/runbooks/tinydb-to-browser-storage.md` once, before upgrading.

## Local commands

- Install dependencies: `npm install`
- Start app: `npm run dev`
- Run typecheck: `npm run typecheck`
- Run tests: `npm run test`
