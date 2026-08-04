from __future__ import annotations

from datetime import date

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.coach_summary import (
    COACH_SUMMARY_UNAVAILABLE_NOTE,
    CoachSummaryGenerator,
    CoachSummaryRequest,
    OpenAICoachSummaryGenerator,
    detect_predominant_answer_language,
)
from app.config import Settings
from app.db import (
    InvalidMorningCheckinStateError,
    MorningCheckinNotReadyForCompletionError,
    MorningCheckinNotFoundError,
    PersonalJournalStore,
)
from app.models import HealthResponse, MorningCheckinResponse, SaveMorningCheckinAnswerRequest


def create_app(
    settings: Settings | None = None,
    coach_summary_generator: CoachSummaryGenerator | None = None,
) -> FastAPI:
    active_settings = settings or Settings()
    store = PersonalJournalStore(active_settings.tinydb_path)
    configured_generator = coach_summary_generator
    if configured_generator is None and active_settings.openai_api_key:
        configured_generator = OpenAICoachSummaryGenerator(
            api_key=active_settings.openai_api_key,
        )

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
        checkin = store.get_or_create_morning_checkin_for_date(browser_date)
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

    @app.post("/api/morning-checkin/{checkin_id}/complete", response_model=MorningCheckinResponse)
    def complete_morning_checkin(checkin_id: str) -> MorningCheckinResponse:
        try:
            checkin, newly_completed = store.complete_checkin(checkin_id)
        except MorningCheckinNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Morning Check-in wurde nicht gefunden.") from exc
        except MorningCheckinNotReadyForCompletionError as exc:
            raise HTTPException(
                status_code=409,
                detail="Bitte beantworte zuerst alle sechs Fragen, bevor du abschliesst.",
            ) from exc

        has_any_answer = any(answer is not None for answer in checkin["answers"])
        if not newly_completed:
            return MorningCheckinResponse(**checkin)

        if has_any_answer and checkin["coach_summary"] is None:
            if configured_generator is None:
                checkin = store.save_coach_summary(checkin_id, COACH_SUMMARY_UNAVAILABLE_NOTE)
                return MorningCheckinResponse(**checkin)

            try:
                generated_summary = configured_generator.generate(
                    CoachSummaryRequest(
                        answers=checkin["answers"],
                        target_language=detect_predominant_answer_language(checkin["answers"]),
                    )
                )
            except Exception:
                generated_summary = None

            if generated_summary and generated_summary.strip():
                checkin = store.save_coach_summary(checkin_id, generated_summary.strip())
            else:
                checkin = store.save_coach_summary(checkin_id, COACH_SUMMARY_UNAVAILABLE_NOTE)

        return MorningCheckinResponse(**checkin)

    @app.get("/api/personal-journal/snapshots", response_model=list[MorningCheckinResponse])
    def list_personal_journal_snapshots() -> list[MorningCheckinResponse]:
        snapshots = store.list_completed_snapshots_newest_first()
        return [MorningCheckinResponse(**snapshot) for snapshot in snapshots]

    @app.get("/api/personal-journal/export")
    def export_personal_journal() -> JSONResponse:
        snapshots = store.list_completed_snapshots_newest_first()
        payload = {
            "snapshots": [MorningCheckinResponse(**snapshot).model_dump(mode="json") for snapshot in snapshots],
        }
        return JSONResponse(
            content=payload,
            headers={"Content-Disposition": 'attachment; filename="personal-journal-export.json"'},
        )

    return app


app = create_app()
