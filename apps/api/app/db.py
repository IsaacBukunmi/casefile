from collections.abc import Iterator
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session

from app.config import get_settings


@lru_cache
def get_engine() -> Engine:
    # One engine per process. It keeps a pool of open connections that requests borrow.
    # pool_pre_ping checks a connection is still alive before lending it out.
    return create_engine(get_settings().database_url, pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    # One session per request. The `with` block closes it afterwards, returning the
    # connection to the pool, even if the endpoint raised an error.
    with Session(get_engine()) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
