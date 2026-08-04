from __future__ import annotations

from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings
from app.db import PersonalJournalStore
from app.models import HealthResponse, MorningCheckinResponse


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

    return app


app = create_app()
