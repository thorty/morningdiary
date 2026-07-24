from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

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
