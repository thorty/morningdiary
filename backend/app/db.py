from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Any, Literal, TypedDict, cast
from uuid import uuid4

from tinydb import Query, TinyDB


class MorningCheckinRecord(TypedDict):
    id: str
    browser_date: date
    status: Literal["unfinished", "completed"]
    answers: list[int | str | None]
    next_question_number: int | None


class MorningCheckinNotFoundError(Exception):
    pass


class InvalidMorningCheckinStateError(Exception):
    pass


QUESTION_COUNT = 6


def _default_answers() -> list[int | str | None]:
    return [None] * QUESTION_COUNT


def _default_answered_questions() -> list[int]:
    return []


class PersonalJournalStore:
    def __init__(self, db_path: Path) -> None:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._db = TinyDB(db_path)
        self._table = self._db.table("morning_checkins")

    def get_or_create_unfinished_morning_checkin(self, browser_date: date) -> MorningCheckinRecord:
        query = Query()
        existing = cast(
            dict[str, Any] | None,
            self._table.get((query.browser_date == browser_date.isoformat()) & (query.status == "unfinished")),
        )
        if existing is not None:
            return self._to_record(existing)

        checkin = {
            "id": str(uuid4()),
            "browser_date": browser_date.isoformat(),
            "status": "unfinished",
            "answers": _default_answers(),
            "answered_questions": _default_answered_questions(),
            "next_question_number": 1,
        }
        self._table.insert(checkin)
        return self._to_record(checkin)

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

        answers = cast(list[int | str | None], list(existing["answers"]))
        answered_questions = cast(list[int], list(existing.get("answered_questions", [])))

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
        }
