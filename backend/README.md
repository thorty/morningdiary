# Morning Coach Backend

FastAPI backend for the Morning Coach Personal Journal.

## Local commands (uv)

- Install dependencies: `uv sync --dev`
- Configure OpenAI: copy `.env.example` to `.env` and set `OPENAI_API_KEY`
- Run service locally: `uv run uvicorn app.main:app --reload`
- Run typecheck: `uv run mypy`
- Run tests: `uv run pytest`
