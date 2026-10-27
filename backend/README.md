# Morning Coach Backend

Stateless FastAPI backend for the Morning Coach Personal Journal.

The Personal Journal is stored in the frontend's browser-local `localStorage`. This service does not retain Morning Check-ins, Daily Snapshots, exports, or User Profiles. It provides the Health Check and the optional Coach Summary operation only.

## Local commands (uv)

- Install dependencies: `uv sync --dev`
- Configure OpenAI: copy `.env.example` to `.env` and set `OPENAI_API_KEY`
- Run service locally: `uv run uvicorn app.main:app --reload`
- Run typecheck: `uv run mypy`
- Run tests: `uv run pytest`

`OPENAI_API_KEY` is loaded only by the backend environment and is never sent to the browser. `POST /api/coach-summary` accepts only the six current answers and target language:

```json
{
  "answers": [4, "Dankbar fuer den ruhigen Morgen", null, null, null, "Den naechsten Schritt"],
  "target_language": "de"
}
```

It returns `{"status":"available","summary":"..."}` on success or `{"status":"unavailable","summary":null}` when generation is not configured or fails. The latter is a successful HTTP response so the frontend can keep the Daily Snapshot complete.
