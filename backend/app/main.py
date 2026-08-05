from __future__ import annotations

from datetime import date
import logging

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


BACKEND_LOGGER_NAME = "morningcoach.backend"


def _configure_backend_logging() -> None:
    root_logger = logging.getLogger()
    if root_logger.handlers:
        return
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def _log_info(logger: logging.Logger, message: str, **fields: object) -> None:
    logger.info(_render_log_line(message, fields), extra=fields)


def _log_error(logger: logging.Logger, message: str, **fields: object) -> None:
    logger.error(_render_log_line(message, fields), extra=fields)


def _render_log_line(event: str, fields: dict[str, object]) -> str:
    if not fields:
        return event
    rendered_fields: list[str] = []
    for key in sorted(fields):
        value = _format_field_value(fields[key])
        rendered_fields.append(f"{key}={value}")
    return f"{event} {' '.join(rendered_fields)}"


def _format_field_value(value: object) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        inner = ",".join(_format_field_value(item) for item in value)
        return f"[{inner}]"
    if value is None:
        return "null"
    return str(value)


def create_app(
    settings: Settings | None = None,
    coach_summary_generator: CoachSummaryGenerator | None = None,
) -> FastAPI:
    _configure_backend_logging()
    logger = logging.getLogger(BACKEND_LOGGER_NAME)

    active_settings = settings or Settings()
    store = PersonalJournalStore(active_settings.tinydb_path)
    configured_generator = coach_summary_generator
    if configured_generator is None and active_settings.openai_api_key:
        configured_generator = OpenAICoachSummaryGenerator(
            api_key=active_settings.openai_api_key,
        )

    _log_info(
        logger,
        "backend_started",
        event="backend_started",
        openai_generator_configured=configured_generator is not None,
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
        checkin, outcome = store.get_or_create_morning_checkin_for_date(browser_date)
        _log_info(
            logger,
            "morning_checkin_get_or_create",
            event="morning_checkin_get_or_create",
            checkin_id=checkin["id"],
            browser_date=checkin["browser_date"].isoformat(),
            outcome=outcome,
        )
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
        _log_info(
            logger,
            "morning_checkin_completion_requested",
            event="morning_checkin_completion_requested",
            checkin_id=checkin_id,
        )

        try:
            checkin, completion_outcome = store.complete_checkin(checkin_id)
        except MorningCheckinNotFoundError as exc:
            raise HTTPException(status_code=404, detail="Morning Check-in wurde nicht gefunden.") from exc
        except MorningCheckinNotReadyForCompletionError as exc:
            raise HTTPException(
                status_code=409,
                detail="Bitte beantworte zuerst alle sechs Fragen, bevor du abschliesst.",
            ) from exc

        _log_info(
            logger,
            "morning_checkin_completion_handled",
            event="morning_checkin_completion_handled",
            checkin_id=checkin["id"],
            browser_date=checkin["browser_date"].isoformat(),
            completion_outcome=completion_outcome,
        )

        has_any_answer = any(answer is not None for answer in checkin["answers"])
        if completion_outcome != "newly_completed":
            _log_info(
                logger,
                "morning_checkin_completion_idempotent",
                event="morning_checkin_completion_idempotent",
                requested_checkin_id=checkin_id,
                checkin_id=checkin["id"],
                browser_date=checkin["browser_date"].isoformat(),
                completion_outcome=completion_outcome,
            )
            return MorningCheckinResponse(**checkin)

        _log_info(
            logger,
            "morning_checkin_completed",
            event="morning_checkin_completed",
            checkin_id=checkin["id"],
            browser_date=checkin["browser_date"].isoformat(),
        )

        if has_any_answer and checkin["coach_summary"] is None:
            if configured_generator is None:
                checkin = store.save_coach_summary(checkin_id, COACH_SUMMARY_UNAVAILABLE_NOTE)
                _log_info(
                    logger,
                    "coach_summary_fallback_saved",
                    event="coach_summary_fallback_saved",
                    checkin_id=checkin["id"],
                    browser_date=checkin["browser_date"].isoformat(),
                    reason="generator_not_configured",
                )
                return MorningCheckinResponse(**checkin)

            target_language = detect_predominant_answer_language(checkin["answers"])
            _log_info(
                logger,
                "coach_summary_generation_started",
                event="coach_summary_generation_started",
                checkin_id=checkin["id"],
                browser_date=checkin["browser_date"].isoformat(),
                target_language=target_language,
                answers=checkin["answers"],
            )

            generation_failed_with_exception = False
            try:
                generated_summary = configured_generator.generate(
                    CoachSummaryRequest(
                        answers=checkin["answers"],
                        target_language=target_language,
                    )
                )
            except Exception as exc:
                generation_failed_with_exception = True
                _log_error(
                    logger,
                    "coach_summary_generation_failed_exception",
                    event="coach_summary_generation_failed_exception",
                    checkin_id=checkin["id"],
                    browser_date=checkin["browser_date"].isoformat(),
                    target_language=target_language,
                    error_type=type(exc).__name__,
                )
                generated_summary = None

            if generated_summary and generated_summary.strip():
                checkin = store.save_coach_summary(checkin_id, generated_summary.strip())
                _log_info(
                    logger,
                    "coach_summary_generation_succeeded",
                    event="coach_summary_generation_succeeded",
                    checkin_id=checkin["id"],
                    browser_date=checkin["browser_date"].isoformat(),
                    target_language=target_language,
                )
            else:
                if not generation_failed_with_exception and (
                    generated_summary is None or not generated_summary.strip()
                ):
                    _log_error(
                        logger,
                        "coach_summary_generation_failed_empty",
                        event="coach_summary_generation_failed_empty",
                        checkin_id=checkin["id"],
                        browser_date=checkin["browser_date"].isoformat(),
                        target_language=target_language,
                    )
                checkin = store.save_coach_summary(checkin_id, COACH_SUMMARY_UNAVAILABLE_NOTE)
                _log_info(
                    logger,
                    "coach_summary_fallback_saved",
                    event="coach_summary_fallback_saved",
                    checkin_id=checkin["id"],
                    browser_date=checkin["browser_date"].isoformat(),
                    reason=(
                        "generation_exception"
                        if generation_failed_with_exception
                        else "generation_empty"
                        if generated_summary is None or not generated_summary.strip()
                        else "generation_blank_text"
                    ),
                )
        elif not has_any_answer:
            _log_info(
                logger,
                "coach_summary_generation_skipped_blank",
                event="coach_summary_generation_skipped_blank",
                checkin_id=checkin["id"],
                browser_date=checkin["browser_date"].isoformat(),
            )

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
