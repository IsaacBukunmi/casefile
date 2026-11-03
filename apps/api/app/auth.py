"""Verifies Clerk session tokens locally, with Clerk's public key (no network call per request)."""

from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, ValidationError

from app.config import Settings, get_settings
from app.errors import Forbidden, Unauthorized

# Reads "Authorization: Bearer <token>" and adds an Authorize button to /docs.
# auto_error=False lets us return our own 401 instead of FastAPI's default.
bearer_scheme = HTTPBearer(auto_error=False, description="Clerk session token")


class OrgClaim(BaseModel):
    # Clerk v2 tokens put the active organization in a compact "o" claim.
    id: str
    rol: str | None = None


class SessionClaims(BaseModel):
    # Only the claims we use. Clerk sends more, and extra="ignore" skips them.
    model_config = ConfigDict(extra="ignore")

    sub: str
    sts: str | None = None
    o: OrgClaim | None = None
    name: str | None = None
    email: str | None = None


class Principal(BaseModel):
    """Who is making the request, and for which organization."""

    user_id: str
    org_id: str
    org_role: str | None
    name: str | None
    email: str | None


def verify_session_token(token: str, settings: Settings) -> SessionClaims:
    try:
        payload = jwt.decode(
            token,
            settings.clerk_jwt_key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
            leeway=5,  # seconds of tolerance for small clock differences between servers
            options={"require": ["exp", "nbf", "iat", "iss", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise Unauthorized("Your session has expired. Sign in again.") from exc
    except jwt.InvalidTokenError as exc:
        raise Unauthorized("Your session is not valid. Sign in again.") from exc

    # The token must have been requested by one of our own frontends.
    azp = payload.get("azp")
    if azp is not None and azp not in settings.clerk_authorized_parties:
        raise Unauthorized("Your session is not valid for this app.")

    try:
        return SessionClaims.model_validate(payload)
    except ValidationError as exc:
        raise Unauthorized("Your session is not valid. Sign in again.") from exc


def get_principal(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Principal:
    if credentials is None:
        raise Unauthorized("Sign in to continue.")

    claims = verify_session_token(credentials.credentials, get_settings())

    # "pending" means signed in but no organization chosen yet. Casefile only works inside one.
    if claims.sts == "pending" or claims.o is None:
        raise Forbidden("Choose an organization to continue.")

    return Principal(
        user_id=claims.sub,
        org_id=claims.o.id,
        org_role=claims.o.rol,
        name=claims.name,
        email=claims.email,
    )


PrincipalDep = Annotated[Principal, Depends(get_principal)]
