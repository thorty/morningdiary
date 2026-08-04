from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from tinydb import Query, TinyDB

from app.config import Settings
from app.main import create_app


def build_client(tmp_path: Path) -> TestClient:
    settings = Settings(tinydb_path=tmp_path / "journal.json")
    app = create_app(settings)
    return TestClient(app)


def test_health_endpoint_reports_ok(tmp_path: Path) -> None:
    client = build_client(tmp_path)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


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
