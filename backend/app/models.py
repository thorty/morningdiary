from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


class MorningCheckinResponse(BaseModel):
    id: str
    browser_date: date
    status: str
