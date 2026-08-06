from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class HealthResponse(BaseModel):
    status: str


class MorningCheckinResponse(BaseModel):
    id: str
    browser_date: date
    status: Literal["unfinished", "completed"]
    answers: list[int | str | None]
    next_question_number: int | None
    coach_summary: str | None = None
    coach_summary_status: Literal["available", "unavailable", "not_requested"] = "not_requested"


class SaveMorningCheckinAnswerRequest(BaseModel):
    question_number: int = Field(ge=1, le=6)
    answer: int | str | None = None

    @model_validator(mode="after")
    def validate_answer(self) -> SaveMorningCheckinAnswerRequest:
        if self.question_number == 1:
            if self.answer is None:
                return self
            if isinstance(self.answer, int) and 1 <= self.answer <= 5:
                return self
            raise ValueError("Mood rating must be an integer between 1 and 5.")

        if self.answer is None:
            return self
        if isinstance(self.answer, str):
            return self
        raise ValueError("Only free-text answers are accepted for questions 2 through 6.")
