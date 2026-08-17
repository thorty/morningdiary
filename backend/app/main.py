from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.coach_summary import (
    CoachSummaryGenerator,
    CoachSummaryRequest as GeneratorRequest,
    OpenAICoachSummaryGenerator,
    detect_predominant_answer_language,
)
from app.config import Settings
from app.models import CoachSummaryRequest, CoachSummaryResponse, HealthResponse


BACKEND_LOGGER_NAME = "morningcoach.backend"


def _configure_backend_logging() -> None:
    root_logger = logging.getLogger()
    if not root_logger.handlers:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )
    logging.getLogger(BACKEND_LOGGER_NAME).setLevel(logging.INFO)


def create_app(
    settings: Settings | None = None,
    coach_summary_generator: CoachSummaryGenerator | None = None,
) -> FastAPI:
    _configure_backend_logging()
    logger = logging.getLogger(BACKEND_LOGGER_NAME)
    active_settings = settings or Settings()
    configured_generator = coach_summary_generator
    if configured_generator is None and active_settings.openai_api_key:
        configured_generator = OpenAICoachSummaryGenerator(api_key=active_settings.openai_api_key)

    logger.info(
        "backend_started openai_generator_configured=%s",
        configured_generator is not None,
        extra={"event": "backend_started", "openai_generator_configured": configured_generator is not None},
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

    @app.post("/api/coach-summary", response_model=CoachSummaryResponse)
    def create_coach_summary(payload: CoachSummaryRequest) -> CoachSummaryResponse:
        if configured_generator is None or not any(answer is not None for answer in payload.answers):
            return CoachSummaryResponse(status="unavailable", summary=None)

        target_language = detect_predominant_answer_language(payload.answers)
        try:
            generated_summary = configured_generator.generate(
                GeneratorRequest(
                    answers=payload.answers,
                    target_language=target_language,
                )
            )
        except Exception as exc:
            logger.error("coach_summary_generation_failed error_type=%s", type(exc).__name__)
            return CoachSummaryResponse(status="unavailable", summary=None)

        if generated_summary is None or not generated_summary.strip():
            logger.error("coach_summary_generation_empty")
            return CoachSummaryResponse(status="unavailable", summary=None)

        return CoachSummaryResponse(status="available", summary=generated_summary.strip())

    return app


app = create_app()
