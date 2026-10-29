from typing import Annotated

from fastapi import Depends

from app.seed import HARLOW


def get_org_id() -> str:
    # Placeholder: in Step 4 this reads the org from the signed-in user's Clerk session.
    return HARLOW


OrgId = Annotated[str, Depends(get_org_id)]
