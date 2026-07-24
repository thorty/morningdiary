from __future__ import annotations

from pathlib import Path

from pydantic import BaseModel, Field


class Settings(BaseModel):
    tinydb_path: Path = Field(default=Path("./data/personal-journal.json"))
