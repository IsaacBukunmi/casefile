from datetime import timedelta

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.main import app
from tests.tokens import TEST_ISSUER, auth_header, make_token


def get_matters(client: TestClient, token: str | None) -> tuple[int, dict[str, object]]:
    headers = auth_header(token) if token else {"Authorization": ""}
    response = client.get("/matters", headers=headers)
    return response.status_code, response.json()


def test_health_needs_no_sign_in(client: TestClient) -> None:
    assert client.get("/health", headers={"Authorization": ""}).status_code == 200


def test_missing_token_is_unauthorized(client: TestClient) -> None:
    status, body = get_matters(client, None)

    assert status == 401
    assert body["code"] == "unauthorized"
    assert body["message"] == "Sign in to continue."


def test_malformed_token_is_unauthorized(client: TestClient) -> None:
    assert get_matters(client, "not-a-jwt")[0] == 401


def test_token_signed_with_another_key_is_unauthorized(client: TestClient) -> None:
    impostor_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    claims = jwt.decode(make_token(), options={"verify_signature": False})
    forged = jwt.encode(claims, impostor_key, algorithm="RS256")

    assert get_matters(client, forged)[0] == 401


def test_unsigned_token_is_unauthorized(client: TestClient) -> None:
    # The classic "alg: none" attack: a token with no signature at all.
    claims = jwt.decode(make_token(), options={"verify_signature": False})
    unsigned = jwt.encode(claims, key=None, algorithm="none")

    assert get_matters(client, unsigned)[0] == 401


def test_expired_token_is_unauthorized(client: TestClient) -> None:
    status, body = get_matters(client, make_token(expires_in=timedelta(minutes=-5)))

    assert status == 401
    assert body["message"] == "Your session has expired. Sign in again."


def test_token_from_another_clerk_instance_is_unauthorized(client: TestClient) -> None:
    assert get_matters(client, make_token(iss="https://someone-else.clerk.accounts.dev"))[0] == 401


def test_token_requested_by_another_site_is_unauthorized(client: TestClient) -> None:
    assert get_matters(client, make_token(azp="https://evil.example"))[0] == 401


def test_pending_session_is_forbidden(client: TestClient) -> None:
    # Pending even though an org is present: the status alone must block the request.
    status, body = get_matters(client, make_token(sts="pending"))

    assert status == 403
    assert body["code"] == "forbidden"


def test_session_without_an_organization_is_forbidden(client: TestClient) -> None:
    assert get_matters(client, make_token(org_id=None))[0] == 403


def test_first_request_from_a_new_user_creates_them(client: TestClient) -> None:
    token = make_token(user_id="user_ada", name="Ada Lovelace", email="ada@example.com")
    response = client.post(
        "/matters",
        headers=auth_header(token),
        json={"name": "Engine patent", "client": "Babbage & Co", "practice_area": "technology"},
    )

    assert response.status_code == 201
    assert response.json()["owner"] == {"id": "user_ada", "name": "Ada Lovelace", "initials": "AL"}


def test_a_changed_name_is_updated(client: TestClient) -> None:
    renamed = make_token(name="Maya Okafor-Reyes")
    response = client.patch("/matters/mat_1", headers=auth_header(renamed), json={})

    assert response.json()["owner"]["name"] == "Maya Okafor-Reyes"


def test_docs_offer_bearer_sign_in() -> None:
    schemes = app.openapi()["components"]["securitySchemes"]

    assert schemes["HTTPBearer"]["scheme"] == "bearer"


def test_issuer_constant_matches_settings() -> None:
    from app.config import get_settings

    assert get_settings().clerk_issuer == TEST_ISSUER
