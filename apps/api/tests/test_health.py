from fastapi.testclient import TestClient


def test_health_checks_the_database(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok", "database": "ok"}


def test_unknown_routes_use_the_error_format(client: TestClient) -> None:
    response = client.get("/nope")

    assert response.status_code == 404
    assert response.json()["code"] == "not_found"
