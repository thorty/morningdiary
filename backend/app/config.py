from __future__ import annotations

import os
from pathlib import Path

from dotenv import dotenv_values
from pydantic import BaseModel, Field


BACKEND_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def _openai_api_key() -> str | None:
    environment_value = os.getenv("OPENAI_API_KEY")
    if environment_value:
        return environment_value

    file_value = dotenv_values(BACKEND_ENV_PATH).get("OPENAI_API_KEY")
    return file_value if isinstance(file_value, str) and file_value else None


class Settings(BaseModel):
    openai_api_key: str | None = Field(default_factory=_openai_api_key)
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
