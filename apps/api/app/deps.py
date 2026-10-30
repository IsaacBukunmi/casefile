from typing import Annotated

from fastapi import Depends

from app.seed import DEMO_USER, HARLOW


def get_org_id() -> str:
    # Placeholder: in Step 4 this reads the org from the signed-in user's Clerk session.
    return HARLOW


OrgId = Annotated[str, Depends(get_org_id)]


def get_user_id() -> str:
    # Placeholder: in Step 4 this reads the signed-in user from the Clerk session.
    return DEMO_USER


UserId = Annotated[str, Depends(get_user_id)]
