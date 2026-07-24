from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Any, TypedDict, cast
from uuid import uuid4

from tinydb import Query, TinyDB


class MorningCheckinRecord(TypedDict):
    id: str
    browser_date: date
    status: str


class PersonalJournalStore:
    def __init__(self, db_path: Path) -> None:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self._db = TinyDB(db_path)
        self._table = self._db.table("morning_checkins")

    def get_or_create_unfinished_morning_checkin(self, browser_date: date) -> MorningCheckinRecord:
        query = Query()
        existing = cast(
            dict[str, Any] | None,
            self._table.get(
            (query.browser_date == browser_date.isoformat()) & (query.status == "unfinished")
            ),
        )
        if existing is not None:
            return {
                "id": existing["id"],
                "browser_date": date.fromisoformat(existing["browser_date"]),
                "status": existing["status"],
            }

        checkin = {
            "id": str(uuid4()),
            "browser_date": browser_date.isoformat(),
            "status": "unfinished",
        }
        self._table.insert(checkin)
        return {
            "id": checkin["id"],
            "browser_date": browser_date,
            "status": checkin["status"],
        }
