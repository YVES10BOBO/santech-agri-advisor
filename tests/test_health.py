from fastapi.testclient import TestClient

from app.main import app


def test_health_returns_status():
    with TestClient(app) as client:
        r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in ("ok", "degraded")
    assert "system_version" in body


def test_version_returns_versions():
    with TestClient(app) as client:
        r = client.get("/version")
    assert r.status_code == 200
    assert {"system_version", "model", "prompt_version"} <= r.json().keys()
