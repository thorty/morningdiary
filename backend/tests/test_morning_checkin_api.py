from __future__ import annotations

import logging
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from tinydb import Query, TinyDB

import app.config as config
from app.config import Settings
from app.main import create_app


BACKEND_LOGGER_NAME = "morningcoach.backend"


class FakeSummaryGenerator:
    def __init__(self, response_text: str | None = "Kurz und freundlich", raises: bool = False) -> None:
        self.response_text = response_text
        self.raises = raises
        self.calls: list[dict[str, object]] = []

    def generate(self, request: object) -> str | None:
        target_language = getattr(request, "target_language")
        answers = getattr(request, "answers")
        self.calls.append({"target_language": target_language, "answers": answers})
        if self.raises:
            raise RuntimeError("boom")
        return self.response_text


def build_client(tmp_path: Path) -> TestClient:
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    app = create_app(settings)
    return TestClient(app)


def _records_for_event(caplog: pytest.LogCaptureFixture, event: str) -> list[logging.LogRecord]:
    return [
        record
        for record in caplog.records
        if record.name == BACKEND_LOGGER_NAME and getattr(record, "event", None) == event
    ]


def test_health_endpoint_reports_ok(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_settings_load_openai_key_from_backend_env_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("OPENAI_API_KEY=key-from-env-file\n")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(config, "BACKEND_ENV_PATH", env_file)

    assert Settings().openai_api_key == "key-from-env-file"


def test_process_environment_takes_precedence_over_backend_env_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("OPENAI_API_KEY=key-from-env-file\n")
    monkeypatch.setenv("OPENAI_API_KEY", "key-from-process")
    monkeypatch.setattr(config, "BACKEND_ENV_PATH", env_file)

    assert Settings().openai_api_key == "key-from-process"


def test_rejects_invalid_browser_date(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    response = client.put("/api/morning-checkin", params={"browser_date": "invalid-date"})

    assert response.status_code == 422


def test_returns_same_unfinished_checkin_for_same_browser_date(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    first = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"})
    second = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"})

    assert first.status_code == 200
    assert second.status_code == 200

    first_payload = first.json()
    second_payload = second.json()

    assert first_payload["id"] == second_payload["id"]
    assert first_payload["browser_date"] == "2026-07-24"
    assert second_payload["browser_date"] == "2026-07-24"
    assert first_payload["status"] == "unfinished"
    assert second_payload["status"] == "unfinished"
    assert first_payload["answers"] == [None, None, None, None, None, None]
    assert second_payload["answers"] == [None, None, None, None, None, None]
    assert first_payload["next_question_number"] == 1
    assert second_payload["next_question_number"] == 1


def test_creates_separate_unfinished_checkins_for_different_browser_dates(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    first = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"})
    second = client.put("/api/morning-checkin", params={"browser_date": "2026-07-25"})

    assert first.status_code == 200
    assert second.status_code == 200

    first_payload = first.json()
    second_payload = second.json()

    assert first_payload["id"] != second_payload["id"]
    assert first_payload["browser_date"] == "2026-07-24"
    assert second_payload["browser_date"] == "2026-07-25"
    assert first_payload["status"] == "unfinished"
    assert second_payload["status"] == "unfinished"


def test_allows_cors_preflight_for_local_frontend(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    response = client.options(
        "/api/morning-checkin",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "PUT",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_saves_optional_answers_and_advances_to_next_question(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]

    saved_mood = client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 5},
    )
    saved_blank_text = client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 2, "answer": None},
    )

    assert saved_mood.status_code == 200
    assert saved_blank_text.status_code == 200
    assert saved_mood.json()["answers"] == [5, None, None, None, None, None]
    assert saved_mood.json()["next_question_number"] == 2
    assert saved_blank_text.json()["answers"] == [5, None, None, None, None, None]
    assert saved_blank_text.json()["next_question_number"] == 3


def test_rejects_invalid_mood_rating_with_client_visible_message(tmp_path: Path) -> None:
    client = build_client(tmp_path)
    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()

    response = client.post(
        f"/api/morning-checkin/{checkin['id']}/answers",
        json={"question_number": 1, "answer": "bad"},
    )

    assert response.status_code == 422
    assert "Mood rating must be an integer between 1 and 5." in response.text


def test_returns_not_found_for_unknown_checkin_state_when_saving_answer(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    response = client.post(
        "/api/morning-checkin/missing-checkin/answers",
        json={"question_number": 1, "answer": 3},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Morning Check-in wurde nicht gefunden."}


def test_resume_returns_saved_answers_and_next_question_for_same_day(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    first = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = first["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 2},
    )
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 2, "answer": "Kurz notiert"},
    )

    resumed = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"})

    assert resumed.status_code == 200
    assert resumed.json()["id"] == checkin_id
    assert resumed.json()["answers"] == [2, "Kurz notiert", None, None, None, None]
    assert resumed.json()["next_question_number"] == 3


def test_restart_clears_only_unfinished_checkin(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 4},
    )

    restarted = client.post(f"/api/morning-checkin/{checkin_id}/restart")

    assert restarted.status_code == 200
    assert restarted.json()["answers"] == [None, None, None, None, None, None]
    assert restarted.json()["next_question_number"] == 1


def test_restart_rejects_completed_checkin(tmp_path: Path) -> None:
    client = build_client(tmp_path)
    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()

    db = TinyDB(tmp_path / "journal.json")
    table = db.table("morning_checkins")
    query = Query()
    table.update({"status": "completed", "next_question_number": None}, query.id == checkin["id"])
    db.close()

    restarted = client.post(f"/api/morning-checkin/{checkin['id']}/restart")

    assert restarted.status_code == 409
    assert restarted.json() == {
        "detail": "Ein abgeschlossener Morning Check-in kann nicht neu gestartet werden."
    }


def test_save_answer_rejects_completed_checkin_state(tmp_path: Path) -> None:
    client = build_client(tmp_path)
    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()

    db = TinyDB(tmp_path / "journal.json")
    table = db.table("morning_checkins")
    query = Query()
    table.update({"status": "completed", "next_question_number": None}, query.id == checkin["id"])
    db.close()

    response = client.post(
        f"/api/morning-checkin/{checkin['id']}/answers",
        json={"question_number": 1, "answer": 4},
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Dieser Morning Check-in kann nicht mehr bearbeitet werden."}


def test_resume_handles_preexisting_unfinished_record_without_answers_fields(tmp_path: Path) -> None:
    db = TinyDB(tmp_path / "journal.json")
    table = db.table("morning_checkins")
    table.insert(
        {
            "id": "legacy-checkin",
            "browser_date": "2026-07-24",
            "status": "unfinished",
        }
    )
    db.close()

    client = build_client(tmp_path)
    response = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"})

    assert response.status_code == 200
    assert response.json()["id"] == "legacy-checkin"
    assert response.json()["answers"] == [None, None, None, None, None, None]
    assert response.json()["next_question_number"] == 1


def test_save_answer_handles_preexisting_unfinished_record_without_answers_fields(tmp_path: Path) -> None:
    db = TinyDB(tmp_path / "journal.json")
    table = db.table("morning_checkins")
    table.insert(
        {
            "id": "legacy-checkin",
            "browser_date": "2026-07-24",
            "status": "unfinished",
        }
    )
    db.close()

    client = build_client(tmp_path)
    response = client.post(
        "/api/morning-checkin/legacy-checkin/answers",
        json={"question_number": 1, "answer": 4},
    )

    assert response.status_code == 200
    assert response.json()["answers"] == [4, None, None, None, None, None]
    assert response.json()["next_question_number"] == 2


def test_completes_checkin_and_returns_daily_snapshot(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 4},
    )
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 2, "answer": "Dankbar fuer Ruhe"},
    )
    for question_number in range(3, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json() == {
        "id": checkin_id,
        "browser_date": "2026-07-24",
        "status": "completed",
        "answers": [4, "Dankbar fuer Ruhe", None, None, None, None],
        "next_question_number": None,
        "coach_summary": "Deine Zusammenfassung konnte heute nicht erstellt werden.",
        "coach_summary_status": "unavailable",
        "coach_summary_retry_available": False,
    }


def test_blank_checkin_can_complete_and_stays_blank(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    for question_number in range(1, 7):
        answer = None
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": answer},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["answers"] == [None, None, None, None, None, None]
    assert response.json()["next_question_number"] is None
    assert response.json()["coach_summary"] is None
    assert response.json()["coach_summary_status"] == "not_requested"


def test_rejects_completion_before_all_questions_are_submitted(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()

    response = client.post(f"/api/morning-checkin/{checkin['id']}/complete")

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Bitte beantworte zuerst alle sechs Fragen, bevor du abschliesst."
    }


def test_get_or_create_returns_existing_completed_snapshot_for_same_date(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    first = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{first['id']}/answers",
            json={"question_number": question_number, "answer": None},
        )
    completed = client.post(f"/api/morning-checkin/{first['id']}/complete")
    reopened = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"})

    assert completed.status_code == 200
    assert reopened.status_code == 200
    assert reopened.json()["id"] == first["id"]
    assert reopened.json()["status"] == "completed"
    assert reopened.json()["next_question_number"] is None
    assert reopened.json()["coach_summary"] is None


def test_completion_is_idempotent_for_same_checkin(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    for question_number in range(1, 7):
        answer = None
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": answer},
        )

    first_completion = client.post(f"/api/morning-checkin/{checkin_id}/complete")
    second_completion = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert first_completion.status_code == 200
    assert second_completion.status_code == 200
    assert first_completion.json() == second_completion.json()


def test_complete_returns_existing_snapshot_when_another_same_day_checkin_is_submitted(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    first = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{first['id']}/answers",
            json={"question_number": question_number, "answer": None},
        )
    first_completed = client.post(f"/api/morning-checkin/{first['id']}/complete")

    db = TinyDB(tmp_path / "journal.json")
    table = db.table("morning_checkins")
    table.insert(
        {
            "id": "duplicate-unfinished",
            "browser_date": "2026-07-24",
            "status": "unfinished",
            "answers": [1, None, None, None, None, None],
            "answered_questions": [1],
            "next_question_number": 2,
        }
    )
    db.close()

    duplicate_completion = client.post("/api/morning-checkin/duplicate-unfinished/complete")

    assert first_completed.status_code == 200
    assert duplicate_completion.status_code == 200
    assert duplicate_completion.json() == first_completed.json()


def test_completion_generates_optional_coach_summary_for_non_blank_checkin(tmp_path: Path) -> None:
    fake_generator = FakeSummaryGenerator(response_text="Du bist auf einem guten Weg.")
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 4},
    )
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 2, "answer": "Ich bin dankbar fuer den ruhigen Morgen."},
    )
    for question_number in range(3, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json()["coach_summary"] == "Du bist auf einem guten Weg."
    assert len(fake_generator.calls) == 1
    assert fake_generator.calls[0]["target_language"] == "de"
    assert fake_generator.calls[0]["answers"] == [4, "Ich bin dankbar fuer den ruhigen Morgen.", None, None, None, None]


def test_completion_detects_english_predominance_for_summary_language(tmp_path: Path) -> None:
    fake_generator = FakeSummaryGenerator(response_text="You are doing great.")
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 4},
    )
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 2, "answer": "I feel grateful and full of energy today."},
    )
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 3, "answer": "I want to let go of stress."},
    )
    for question_number in range(4, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json()["coach_summary"] == "You are doing great."
    assert fake_generator.calls[0]["target_language"] == "en"


def test_completion_defaults_to_german_for_mixed_answer_language(tmp_path: Path) -> None:
    fake_generator = FakeSummaryGenerator(response_text="Gute Balance heute.")
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 4},
    )
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 2, "answer": "I feel grateful today."},
    )
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 3, "answer": "Ich will Stress loslassen."},
    )
    for question_number in range(4, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json()["coach_summary"] == "Gute Balance heute."
    assert fake_generator.calls[0]["target_language"] == "de"


def test_completion_uses_german_fallback_note_when_summary_generation_fails(tmp_path: Path) -> None:
    fake_generator = FakeSummaryGenerator(raises=True)
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    for question_number in range(1, 7):
        answer = "Only english text" if question_number == 2 else None
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": answer},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["coach_summary"] == "Deine Zusammenfassung konnte heute nicht erstellt werden."


def test_completed_snapshot_retries_a_failed_coach_summary_without_changing_answers(tmp_path: Path) -> None:
    fake_generator = FakeSummaryGenerator(raises=True)
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": "Eine Antwort" if question_number == 2 else None},
        )

    first_completion = client.post(f"/api/morning-checkin/{checkin_id}/complete")
    fake_generator.raises = False
    fake_generator.response_text = "Ein neuer, freundlicher Blick auf deinen Tag."
    retry = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert first_completion.json()["coach_summary"] == "Deine Zusammenfassung konnte heute nicht erstellt werden."
    assert retry.json()["status"] == "completed"
    assert retry.json()["answers"] == [None, "Eine Antwort", None, None, None, None]
    assert retry.json()["coach_summary"] == "Ein neuer, freundlicher Blick auf deinen Tag."
    assert len(fake_generator.calls) == 2


def test_completion_uses_german_fallback_note_when_generator_returns_no_text(tmp_path: Path) -> None:
    fake_generator = FakeSummaryGenerator(response_text=None)
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 3},
    )
    for question_number in range(2, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json()["coach_summary"] == "Deine Zusammenfassung konnte heute nicht erstellt werden."


def test_blank_completion_does_not_call_summary_generator(tmp_path: Path) -> None:
    fake_generator = FakeSummaryGenerator(response_text="This should not be used")
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json()["coach_summary"] is None
    assert fake_generator.calls == []


def test_non_blank_completion_without_configured_generator_uses_fallback_note(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 5},
    )
    for question_number in range(2, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    assert response.json()["coach_summary"] == "Deine Zusammenfassung konnte heute nicht erstellt werden."


def test_personal_journal_returns_completed_snapshots_newest_first(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin_one = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_two = client.put("/api/morning-checkin", params={"browser_date": "2026-07-25"}).json()

    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{checkin_one['id']}/answers",
            json={"question_number": question_number, "answer": None},
        )
        client.post(
            f"/api/morning-checkin/{checkin_two['id']}/answers",
            json={"question_number": question_number, "answer": None if question_number != 2 else "Dankbar"},
        )

    client.post(f"/api/morning-checkin/{checkin_one['id']}/complete")
    client.post(f"/api/morning-checkin/{checkin_two['id']}/complete")

    response = client.get("/api/personal-journal/snapshots")

    assert response.status_code == 200
    payload = response.json()
    assert [snapshot["browser_date"] for snapshot in payload] == ["2026-07-25", "2026-07-24"]
    assert payload[0]["status"] == "completed"
    assert payload[1]["status"] == "completed"


def test_personal_journal_excludes_unfinished_checkins(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    unfinished = client.put("/api/morning-checkin", params={"browser_date": "2026-07-26"}).json()
    completed = client.put("/api/morning-checkin", params={"browser_date": "2026-07-25"}).json()

    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{completed['id']}/answers",
            json={"question_number": question_number, "answer": None},
        )
    client.post(f"/api/morning-checkin/{completed['id']}/complete")

    response = client.get("/api/personal-journal/snapshots")

    assert response.status_code == 200
    assert [snapshot["id"] for snapshot in response.json()] == [completed["id"]]
    assert unfinished["id"] not in [snapshot["id"] for snapshot in response.json()]


def test_personal_journal_export_returns_all_completed_snapshots_with_answers_and_summary_data(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    first = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    second = client.put("/api/morning-checkin", params={"browser_date": "2026-07-25"}).json()

    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{first['id']}/answers",
            json={"question_number": question_number, "answer": None if question_number != 2 else "Ruhig"},
        )
        client.post(
            f"/api/morning-checkin/{second['id']}/answers",
            json={"question_number": question_number, "answer": 5 if question_number == 1 else None},
        )

    client.post(f"/api/morning-checkin/{first['id']}/complete")
    client.post(f"/api/morning-checkin/{second['id']}/complete")

    export_response = client.get("/api/personal-journal/export")

    assert export_response.status_code == 200
    assert export_response.headers["content-type"].startswith("application/json")
    assert "attachment; filename=" in export_response.headers["content-disposition"]

    payload = export_response.json()
    assert list(payload.keys()) == ["snapshots"]
    assert [snapshot["browser_date"] for snapshot in payload["snapshots"]] == ["2026-07-25", "2026-07-24"]
    assert payload["snapshots"][0]["answers"] == [5, None, None, None, None, None]
    assert payload["snapshots"][1]["answers"] == [None, "Ruhig", None, None, None, None]
    assert payload["snapshots"][0]["coach_summary"] == "Deine Zusammenfassung konnte heute nicht erstellt werden."
    assert payload["snapshots"][1]["coach_summary"] == "Deine Zusammenfassung konnte heute nicht erstellt werden."


def test_personal_journal_export_preserves_null_coach_summary_for_blank_snapshots(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{checkin['id']}/answers",
            json={"question_number": question_number, "answer": None},
        )
    client.post(f"/api/morning-checkin/{checkin['id']}/complete")

    export_response = client.get("/api/personal-journal/export")

    assert export_response.status_code == 200
    payload = export_response.json()
    assert payload["snapshots"][0]["coach_summary"] is None


def test_logs_backend_startup_when_app_is_created(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger=BACKEND_LOGGER_NAME)

    _ = build_client(tmp_path)

    startup_records = _records_for_event(caplog, "backend_started")
    assert len(startup_records) == 1


def test_backend_info_logs_remain_enabled_when_root_logging_is_already_configured(tmp_path: Path) -> None:
    logger = logging.getLogger(BACKEND_LOGGER_NAME)
    previous_level = logger.level
    logger.setLevel(logging.NOTSET)
    try:
        _ = build_client(tmp_path)

        assert logger.level == logging.INFO
    finally:
        logger.setLevel(previous_level)


def test_logs_generation_start_and_success_context(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger=BACKEND_LOGGER_NAME)
    fake_generator = FakeSummaryGenerator(response_text="Du bist auf einem guten Weg.")
    settings = Settings(tinydb_path=tmp_path / "journal.json", openai_api_key="super-secret-key")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 4},
    )
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 2, "answer": "Ich bin dankbar fuer den ruhigen Morgen."},
    )
    for question_number in range(3, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    started_records = _records_for_event(caplog, "coach_summary_generation_started")
    assert len(started_records) == 1
    assert getattr(started_records[0], "checkin_id") == checkin_id
    assert getattr(started_records[0], "target_language") == "de"
    assert getattr(started_records[0], "answers") == [
        4,
        "Ich bin dankbar fuer den ruhigen Morgen.",
        None,
        None,
        None,
        None,
    ]

    success_records = _records_for_event(caplog, "coach_summary_generation_succeeded")
    assert len(success_records) == 1
    assert getattr(success_records[0], "checkin_id") == checkin_id
    assert "super-secret-key" not in caplog.text


def test_logs_generation_exception_and_fallback_persistence(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger=BACKEND_LOGGER_NAME)
    fake_generator = FakeSummaryGenerator(raises=True)
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    for question_number in range(1, 7):
        answer = "Only english text" if question_number == 2 else None
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": answer},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    error_records = _records_for_event(caplog, "coach_summary_generation_failed_exception")
    assert len(error_records) == 1
    assert getattr(error_records[0], "checkin_id") == checkin_id

    fallback_records = _records_for_event(caplog, "coach_summary_fallback_saved")
    assert len(fallback_records) == 1
    assert getattr(fallback_records[0], "reason") == "generation_exception"


def test_logs_empty_generation_output_as_error_and_fallback(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger=BACKEND_LOGGER_NAME)
    fake_generator = FakeSummaryGenerator(response_text=None)
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 3},
    )
    for question_number in range(2, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    empty_records = _records_for_event(caplog, "coach_summary_generation_failed_empty")
    assert len(empty_records) == 1
    assert getattr(empty_records[0], "checkin_id") == checkin_id

    fallback_records = _records_for_event(caplog, "coach_summary_fallback_saved")
    assert len(fallback_records) == 1
    assert getattr(fallback_records[0], "reason") == "generation_empty"


def test_logs_blank_generation_output_as_error_and_fallback(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger=BACKEND_LOGGER_NAME)
    fake_generator = FakeSummaryGenerator(response_text="   ")
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 3},
    )
    for question_number in range(2, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    empty_records = _records_for_event(caplog, "coach_summary_generation_failed_empty")
    assert len(empty_records) == 1

    fallback_records = _records_for_event(caplog, "coach_summary_fallback_saved")
    assert len(fallback_records) == 1
    assert getattr(fallback_records[0], "reason") == "generation_empty"


def test_logs_blank_completion_and_idempotent_completion_paths(
    tmp_path: Path,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.INFO, logger=BACKEND_LOGGER_NAME)
    fake_generator = FakeSummaryGenerator(response_text="unused")
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    for question_number in range(1, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    first_completion = client.post(f"/api/morning-checkin/{checkin_id}/complete")
    second_completion = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert first_completion.status_code == 200
    assert second_completion.status_code == 200
    assert _records_for_event(caplog, "coach_summary_generation_skipped_blank")
    assert _records_for_event(caplog, "morning_checkin_completion_idempotent")
    assert not _records_for_event(caplog, "coach_summary_generation_started")


def test_logs_render_context_fields_in_terminal_message(tmp_path: Path, caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level(logging.INFO, logger=BACKEND_LOGGER_NAME)
    fake_generator = FakeSummaryGenerator(response_text="Du bist auf einem guten Weg.")
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    client = TestClient(create_app(settings, coach_summary_generator=fake_generator))

    checkin = client.put("/api/morning-checkin", params={"browser_date": "2026-07-24"}).json()
    checkin_id = checkin["id"]
    client.post(
        f"/api/morning-checkin/{checkin_id}/answers",
        json={"question_number": 1, "answer": 4},
    )
    for question_number in range(2, 7):
        client.post(
            f"/api/morning-checkin/{checkin_id}/answers",
            json={"question_number": question_number, "answer": None},
        )

    response = client.post(f"/api/morning-checkin/{checkin_id}/complete")

    assert response.status_code == 200
    started_records = _records_for_event(caplog, "coach_summary_generation_started")
    assert len(started_records) == 1
    message = started_records[0].getMessage()
    assert "checkin_id=" in message
    assert "target_language=" in message
    assert "answers=" in message
