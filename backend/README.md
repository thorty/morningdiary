# Morning Coach Backend

Stateless FastAPI backend for the Morning Coach Personal Journal.

The Personal Journal is stored in the frontend's browser-local `localStorage`. This service does not create or read TinyDB files and does not retain Morning Check-ins, Daily Snapshots, exports, or User Profiles. It provides the Health Check and the optional Coach Summary operation only.

## Local commands (uv)

- Install dependencies: `uv sync --dev`
- Configure OpenAI: copy `.env.example` to `.env` and set `OPENAI_API_KEY`
- Run service locally: `uv run uvicorn app.main:app --reload`
- Run typecheck: `uv run mypy`
- Run tests: `uv run pytest`

`OPENAI_API_KEY` is loaded only by the backend environment and is never sent to the browser. Coach Summary requests contain only the current answers and target language; failures are returned as controlled unavailable results so local journal completion does not depend on OpenAI.
