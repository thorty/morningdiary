from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import app.config as config
from app.config import Settings
from app.main import create_app


ANSWERS = [4, "Ich bin dankbar fuer den ruhigen Morgen.", None, "Zeit fuer mich", None, "Den naechsten Schritt"]


class FakeSummaryGenerator:
    def __init__(self, response_text: str | None = "Kurz und freundlich", raises: bool = False) -> None:
        self.response_text = response_text
        self.raises = raises
        self.calls: list[dict[str, object]] = []

    def generate(self, request: object) -> str | None:
        self.calls.append(
            {
                "answers": getattr(request, "answers"),
                "target_language": getattr(request, "target_language"),
            }
        )
        if self.raises:
            raise RuntimeError("generator failed")
        return self.response_text


def build_client(
    *,
    generator: FakeSummaryGenerator | None = None,
    settings: Settings | None = None,
) -> TestClient:
    return TestClient(create_app(settings or Settings(), coach_summary_generator=generator))


def test_health_endpoint_reports_ok_and_allows_frontend_cors() -> None:
    client = build_client()

    health = client.get("/health")
    preflight = client.options(
        "/api/coach-summary",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert preflight.status_code == 200
    assert preflight.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_backend_startup_does_not_create_journal_storage(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    journal_path = tmp_path / "data" / "personal-journal.json"
    monkeypatch.chdir(tmp_path)

    build_client(settings=Settings())

    assert not journal_path.exists()
    assert not hasattr(Settings(), "tinydb_path")


def test_settings_load_openai_key_only_from_backend_environment(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("OPENAI_API_KEY=key-from-backend-env\n")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(config, "BACKEND_ENV_PATH", env_file)

    assert Settings().openai_api_key == "key-from-backend-env"


def test_process_environment_takes_precedence_over_backend_env_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("OPENAI_API_KEY=key-from-env-file\n")
    monkeypatch.setenv("OPENAI_API_KEY", "key-from-process")
    monkeypatch.setattr(config, "BACKEND_ENV_PATH", env_file)

    assert Settings().openai_api_key == "key-from-process"


def test_generates_summary_from_only_current_answers_and_target_language() -> None:
    generator = FakeSummaryGenerator(response_text="Du bist auf einem guten Weg.")
    client = build_client(generator=generator)

    response = client.post(
        "/api/coach-summary",
        json={"answers": ANSWERS, "target_language": "de"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "available", "summary": "Du bist auf einem guten Weg."}
    assert generator.calls == [{"answers": ANSWERS, "target_language": "de"}]
    assert "OPENAI_API_KEY" not in response.text


def test_detects_predominant_language_and_defaults_mixed_answers_to_german() -> None:
    generator = FakeSummaryGenerator(response_text="You can take the next step.")
    client = build_client(generator=generator)

    response = client.post(
        "/api/coach-summary",
        json={
            "answers": [5, "I feel grateful and full of energy today.", None, None, None, "I can choose my next action."],
            "target_language": "en",
        },
    )

    assert response.status_code == 200
    assert response.json() == {"status": "available", "summary": "You can take the next step."}
    assert generator.calls[0] == {
        "answers": [5, "I feel grateful and full of energy today.", None, None, None, "I can choose my next action."],
        "target_language": "en",
    }

    mixed_generator = FakeSummaryGenerator(response_text="Gute Balance heute.")
    mixed_response = build_client(generator=mixed_generator).post(
        "/api/coach-summary",
        json={
            "answers": [4, "I feel grateful today.", None, "Ich will Stress loslassen.", None, None],
            "target_language": "en",
        },
    )

    assert mixed_response.status_code == 200
    assert mixed_generator.calls[0]["target_language"] == "de"


@pytest.mark.parametrize(
    ("response_text", "raises"),
    [(None, False), ("   ", False), (None, True)],
)
def test_returns_controlled_unavailable_result_for_generator_failures(
    response_text: str | None,
    raises: bool,
) -> None:
    generator = FakeSummaryGenerator(response_text=response_text, raises=raises)
    client = build_client(generator=generator)

    response = client.post(
        "/api/coach-summary",
        json={"answers": ANSWERS, "target_language": "de"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "unavailable", "summary": None}


def test_returns_unavailable_when_no_generator_is_configured() -> None:
    response = build_client().post(
        "/api/coach-summary",
        json={"answers": ANSWERS, "target_language": "de"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "unavailable", "summary": None}


def test_blank_answers_do_not_call_the_generator() -> None:
    generator = FakeSummaryGenerator(response_text="This must not be generated")

    response = build_client(generator=generator).post(
        "/api/coach-summary",
        json={"answers": [None, None, None, None, None, None], "target_language": "de"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "unavailable", "summary": None}
    assert generator.calls == []


@pytest.mark.parametrize(
    "payload",
    [
        {"answers": ["invalid-mood", None, None, None, None, None], "target_language": "de"},
        {"answers": [3, 42, None, None, None, None], "target_language": "de"},
        {"answers": [3, None, None], "target_language": "de"},
        {"answers": [3, None, None, None, None, None], "target_language": "fr"},
        {"answers": [3, None, None, None, None, None], "target_language": "de", "user_id": "user-1"},
        {"answers": [3.0, None, None, None, None, None], "target_language": "de"},
    ],
)
def test_rejects_malformed_answers_language_or_identity_fields(payload: dict[str, object]) -> None:
    generator = FakeSummaryGenerator()
    response = build_client(generator=generator).post("/api/coach-summary", json=payload)

    assert response.status_code == 422
    assert generator.calls == []
