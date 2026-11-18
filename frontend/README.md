# Morning Coach Frontend

Next.js frontend for the Morning Coach Personal Journal.

The Personal Journal Store is the production persistence boundary. It stores unfinished Morning Check-ins and completed Daily Snapshots in a versioned, namespaced `localStorage` document for the current browser profile. The frontend does not use backend journal CRUD, history, export, or delete endpoints. The stateless backend is contacted only for the optional Coach Summary and Health Check.

Browser-local storage is device- and browser-profile-specific. It is not synchronization, encryption, or authentication. 

## Local commands

- Install dependencies: `npm install`
- Start app: `BACKEND_BASE_URL=http://localhost:8000 npm run dev` (with the backend already running on port `8000`)
- Run lint: `npm run lint`
- Run typecheck: `npm run typecheck`
- Run tests: `npm run test`
- Run tests with v8 coverage: `npm run test:coverage`

Coverage is reported without a minimum threshold.

The browser calls the same-origin Next.js route at `/api/coach-summary`. The
route forwards the request server-side to FastAPI. For Docker Compose, the
frontend container uses `BACKEND_BASE_URL=http://backend:8000`; for a
standalone local frontend process, use `http://localhost:8000`. Neither value
is exposed to browser JavaScript.
