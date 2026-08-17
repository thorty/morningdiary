from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, StrictInt, StrictStr, field_validator


class HealthResponse(BaseModel):
    status: str


class CoachSummaryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answers: list[StrictInt | StrictStr | None] = Field(min_length=6, max_length=6)
    target_language: Literal["de", "en"]

    @field_validator("answers")
    @classmethod
    def validate_answers(cls, answers: list[StrictInt | StrictStr | None]) -> list[StrictInt | StrictStr | None]:
        if answers[0] is not None and (
            not isinstance(answers[0], int) or isinstance(answers[0], bool) or not 1 <= answers[0] <= 5
        ):
            raise ValueError("Mood rating must be an integer between 1 and 5.")
        if any(answer is not None and not isinstance(answer, str) for answer in answers[1:]):
            raise ValueError("Only free-text answers are accepted for questions 2 through 6.")
        return answers


class CoachSummaryResponse(BaseModel):
    status: Literal["available", "unavailable"]
    summary: str | None
