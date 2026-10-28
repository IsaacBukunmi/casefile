from typing import Annotated

from fastapi import Depends, Request

from app.seed import HARLOW
from app.store import Store


def get_store(request: Request) -> Store:
    # The store is created once at startup and attached to the app.
    store: Store = request.app.state.store
    return store


def get_org_id() -> str:
    # Placeholder: in Step 4 this reads the org from the signed-in user's Clerk session.
    return HARLOW


StoreDep = Annotated[Store, Depends(get_store)]
OrgId = Annotated[str, Depends(get_org_id)]
