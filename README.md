# Morning Coach

Morning Coach is a small personal journaling app with a Next.js frontend and a stateless FastAPI backend. Check-ins and journal entries stay in the browser's `localStorage`; the backend is only used to generate optional AI coach summaries.

## Run with Docker

Requirements: Docker with Docker Compose.

1. Create `backend/.env`:

   ```env
   OPENAI_API_KEY=your-openai-api-key
   ```

   The key is optional. Without it, coach summaries are unavailable, but the journal still works. Never commit this file or expose the key to the frontend.

2. Build and start both containers:

   ```bash
   docker compose up --build
   ```

3. Open the services:

   - App: <http://localhost:3000>
   - Backend API: <http://localhost:8000>
   - API health check: <http://localhost:8000/health>

Stop the containers with:

```bash
docker compose down
```

The frontend calls the backend at `http://localhost:8000` by default. Change the `NEXT_PUBLIC_BACKEND_BASE_URL` build argument in `compose.yaml` when deploying under a different public URL.
