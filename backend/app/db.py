from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Any, Literal, TypedDict, cast
from uuid import uuid4

from tinydb import Query, TinyDB

from app.coach_summary import COACH_SUMMARY_UNAVAILABLE_NOTE


class MorningCheckinRecord(TypedDict):
    id: str
    browser_date: date
    status: Literal["unfinished", "completed"]
    answers: list[int | str | None]
    next_question_number: int | None
    coach_summary: str | None
    coach_summary_status: Literal["available", "unavailable", "not_requested"]


class MorningCheckinNotFoundError(Exception):
    pass


class InvalidMorningCheckinStateError(Exception):
    pass


class MorningCheckinNotReadyForCompletionError(Exception):
    pass


QUESTION_COUNT = 6
GetOrCreateOutcome = Literal["created", "resumed_unfinished", "returned_completed"]
CompletionOutcome = Literal[
    "newly_completed",
    "already_completed_same_checkin",
    "already_completed_same_day",
]


def _default_answers() -> list[int | str | None]:
    return [None] * QUESTION_COUNT


def _default_answered_questions() -> list[int]:
    return []


class PersonalJournalStore:
    def __init__(self, db_path: Path) -> None:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._db = TinyDB(db_path)
        self._table = self._db.table("morning_checkins")

    def get_or_create_morning_checkin_for_date(
        self,
        browser_date: date,
    ) -> tuple[MorningCheckinRecord, GetOrCreateOutcome]:
        query = Query()
        existing_completed = cast(
            dict[str, Any] | None,
            self._table.get((query.browser_date == browser_date.isoformat()) & (query.status == "completed")),
        )
        if existing_completed is not None:
            return self._to_record(existing_completed), "returned_completed"

        existing = cast(
            dict[str, Any] | None,
            self._table.get((query.browser_date == browser_date.isoformat()) & (query.status == "unfinished")),
        )
        if existing is not None:
            return self._to_record(existing), "resumed_unfinished"

        checkin = {
            "id": str(uuid4()),
            "browser_date": browser_date.isoformat(),
            "status": "unfinished",
            "answers": _default_answers(),
            "answered_questions": _default_answered_questions(),
            "next_question_number": 1,
        }
        self._table.insert(checkin)
        return self._to_record(checkin), "created"

    def save_answer(
        self,
        checkin_id: str,
        question_number: int,
        answer: int | str | None,
    ) -> MorningCheckinRecord:
        existing = self._get_by_id(checkin_id)
        if existing is None:
            raise MorningCheckinNotFoundError

        if existing["status"] != "unfinished":
            raise InvalidMorningCheckinStateError

        answers = cast(list[int | str | None], list(existing.get("answers", _default_answers())))
        answered_questions = cast(list[int], list(existing.get("answered_questions", [])))
        if not answered_questions:
            answered_questions = [index for index, existing_answer in enumerate(answers, start=1) if existing_answer is not None]

        if question_number not in answered_questions:
            answered_questions.append(question_number)
            answered_questions.sort()

        answers[question_number - 1] = answer
        next_question_number = self._next_unanswered_question(answered_questions)

        self._table.update(
            {
                "answers": answers,
                "answered_questions": answered_questions,
                "next_question_number": next_question_number,
            },
            Query().id == checkin_id,
        )

        updated = self._get_by_id(checkin_id)
        if updated is None:
            raise MorningCheckinNotFoundError
        return self._to_record(updated)

    def restart_unfinished_checkin(self, checkin_id: str) -> MorningCheckinRecord:
        existing = self._get_by_id(checkin_id)
        if existing is None:
            raise MorningCheckinNotFoundError

        if existing["status"] != "unfinished":
            raise InvalidMorningCheckinStateError

        self._table.update(
            {
                "answers": _default_answers(),
                "answered_questions": _default_answered_questions(),
                "next_question_number": 1,
            },
            Query().id == checkin_id,
        )

        updated = self._get_by_id(checkin_id)
        if updated is None:
            raise MorningCheckinNotFoundError
        return self._to_record(updated)

    def complete_checkin(self, checkin_id: str) -> tuple[MorningCheckinRecord, CompletionOutcome]:
        existing = self._get_by_id(checkin_id)
        if existing is None:
            raise MorningCheckinNotFoundError

        if existing["status"] == "completed":
            return self._to_record(existing), "already_completed_same_checkin"

        query = Query()
        browser_date_iso = cast(str, existing["browser_date"])
        already_completed = cast(
            dict[str, Any] | None,
            self._table.get((query.browser_date == browser_date_iso) & (query.status == "completed")),
        )
        if already_completed is not None:
            return self._to_record(already_completed), "already_completed_same_day"

        next_question_number = cast(int | None, existing.get("next_question_number"))
        if next_question_number is not None:
            raise MorningCheckinNotReadyForCompletionError

        self._table.update(
            {
                "status": "completed",
                "next_question_number": None,
            },
            Query().id == checkin_id,
        )

        updated = self._get_by_id(checkin_id)
        if updated is None:
            raise MorningCheckinNotFoundError
        return self._to_record(updated), "newly_completed"

    def _get_by_id(self, checkin_id: str) -> dict[str, Any] | None:
        return cast(dict[str, Any] | None, self._table.get(Query().id == checkin_id))

    def _next_unanswered_question(self, answered_questions: list[int]) -> int | None:
        answered_set = set(answered_questions)
        for index in range(1, QUESTION_COUNT + 1):
            if index not in answered_set:
                return index
        return None

    def _to_record(self, row: dict[str, Any]) -> MorningCheckinRecord:
        answers = cast(list[int | str | None], list(row.get("answers", _default_answers())))
        answered_questions = cast(list[int], list(row.get("answered_questions", [])))
        if not answered_questions:
            answered_questions = [index for index, answer in enumerate(answers, start=1) if answer is not None]

        next_question_number = cast(int | None, row.get("next_question_number"))
        status = cast(Literal["unfinished", "completed"], row["status"])
        if status == "unfinished" and next_question_number is None and len(answered_questions) < QUESTION_COUNT:
            next_question_number = self._next_unanswered_question(answered_questions)

        return {
            "id": cast(str, row["id"]),
            "browser_date": date.fromisoformat(cast(str, row["browser_date"])),
            "status": status,
            "answers": answers,
            "next_question_number": next_question_number,
            "coach_summary": cast(str | None, row.get("coach_summary")),
            "coach_summary_status": (
                "unavailable"
                if row.get("coach_summary") == COACH_SUMMARY_UNAVAILABLE_NOTE
                else "available"
                if row.get("coach_summary")
                else "not_requested"
            ),
        }

    def save_coach_summary(self, checkin_id: str, coach_summary: str) -> MorningCheckinRecord:
        existing = self._get_by_id(checkin_id)
        if existing is None:
            raise MorningCheckinNotFoundError

        if existing["status"] != "completed":
            raise InvalidMorningCheckinStateError

        self._table.update({"coach_summary": coach_summary}, Query().id == checkin_id)
        updated = self._get_by_id(checkin_id)
        if updated is None:
            raise MorningCheckinNotFoundError
        return self._to_record(updated)

    def list_completed_snapshots_newest_first(self) -> list[MorningCheckinRecord]:
        rows = cast(list[dict[str, Any]], self._table.search(Query().status == "completed"))
        ordered = sorted(rows, key=lambda row: cast(str, row["browser_date"]), reverse=True)
        return [self._to_record(row) for row in ordered]
