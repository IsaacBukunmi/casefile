from typing import Annotated

from fastapi import Depends

from app import models
from app.auth import Principal, PrincipalDep
from app.db import SessionDep


def get_org_id(principal: PrincipalDep) -> str:
    return principal.org_id


OrgId = Annotated[str, Depends(get_org_id)]


def initials_for(name: str) -> str:
    words = name.split()
    if len(words) >= 2:
        return (words[0][0] + words[-1][0]).upper()
    return name[:2].upper()


def display_name(principal: Principal) -> str:
    return principal.name or principal.email or "Unknown user"


def get_user_id(principal: PrincipalDep, session: SessionDep) -> str:
    # Matters and reviews point at a local users row, so create or refresh it from the token.
    name = display_name(principal)
    user = session.get(models.User, principal.user_id)
    if user is None:
        session.add(models.User(id=principal.user_id, name=name, initials=initials_for(name)))
        session.commit()
    elif user.name != name:
        user.name = name
        user.initials = initials_for(name)
        session.commit()
    return principal.user_id


UserId = Annotated[str, Depends(get_user_id)]
