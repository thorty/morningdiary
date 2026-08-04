from __future__ import annotations

from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings
from app.db import (
    InvalidMorningCheckinStateError,
    MorningCheckinNotFoundError,
    PersonalJournalStore,
)
from app.models import HealthResponse, MorningCheckinResponse, SaveMorningCheckinAnswerRequest


def create_app(settings: Settings | None = None) -> FastAPI:
    active_settings = settings or Settings()
    store = PersonalJournalStore(active_settings.tinydb_path)

    app = FastAPI(title="Morning Coach Backend")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_allow_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(status="ok")

    @app.put("/api/morning-checkin", response_model=MorningCheckinResponse)
    def get_or_create_morning_checkin(browser_date: date) -> MorningCheckinResponse:
        checkin = store.get_or_create_unfinished_morning_checkin(browser_date)
        return MorningCheckinResponse(**checkin)

    @app.post("/api/morning-checkin/{checkin_id}/answers", response_model=MorningCheckinResponse)
    def save_morning_checkin_answer(
        checkin_id: str,
        payload: SaveMorningCheckinAnswerRequest,
    ) -> MorningCheckinResponse:
        try:
            checkin = store.save_answer(checkin_id, payload.question_number, payload.answer)
        except MorningCheckinNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Morning Check-in wurde nicht gefunden.") from exc
        except InvalidMorningCheckinStateError as exc:
            raise HTTPException(
                status_code=409,
                detail="Dieser Morning Check-in kann nicht mehr bearbeitet werden.",
            ) from exc

        return MorningCheckinResponse(**checkin)

    @app.post("/api/morning-checkin/{checkin_id}/restart", response_model=MorningCheckinResponse)
    def restart_morning_checkin(checkin_id: str) -> MorningCheckinResponse:
        try:
            checkin = store.restart_unfinished_checkin(checkin_id)
        except MorningCheckinNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Morning Check-in wurde nicht gefunden.") from exc
        except InvalidMorningCheckinStateError as exc:
            raise HTTPException(
                status_code=409,
                detail="Ein abgeschlossener Morning Check-in kann nicht neu gestartet werden.",
            ) from exc

        return MorningCheckinResponse(**checkin)

    return app


app = create_app()
