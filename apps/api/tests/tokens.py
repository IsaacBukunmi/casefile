"""Signs test tokens shaped like Clerk's. Import from here, never from conftest.py."""

import os
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app.seed import DEMO_USER, HARLOW

TEST_ISSUER = "https://casefile-test.clerk.accounts.dev"
TEST_ORIGIN = "http://localhost:5173"

# A key pair made fresh for each test run: tests sign tokens with the private key, and the app
# verifies them with the public key, exactly as it does with Clerk's real key in production.
PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
PUBLIC_KEY_PEM = (
    PRIVATE_KEY.public_key()
    .public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
    .decode()
)


def configure_test_auth() -> None:
    """Point the app's Clerk settings at the test key. Call before the app reads its settings."""
    os.environ["CLERK_ISSUER"] = TEST_ISSUER
    os.environ["CLERK_JWT_KEY"] = PUBLIC_KEY_PEM


def make_token(
    user_id: str = DEMO_USER,
    org_id: str | None = HARLOW,
    *,
    expires_in: timedelta = timedelta(minutes=1),
    **extra_claims: Any,
) -> str:
    """Signs a token shaped like a Clerk v2 session token."""
    now = datetime.now(UTC)
    claims: dict[str, Any] = {
        "sub": user_id,
        "iss": TEST_ISSUER,
        "azp": TEST_ORIGIN,
        "iat": now,
        "nbf": now,
        "exp": now + expires_in,
        "name": "Maya Okafor",
        "email": "maya@harlowlane.example",
        "v": 2,
    }
    if org_id is not None:
        claims["o"] = {"id": org_id, "rol": "admin"}
    claims.update(extra_claims)
    return jwt.encode(claims, PRIVATE_KEY, algorithm="RS256")


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
