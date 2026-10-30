import os

# Point the app at the test database before any app module reads its settings.
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://casefile:casefile@localhost:5432/casefile_test"
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from collections.abc import Iterator
from datetime import UTC, datetime

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import Engine, make_url
from sqlalchemy.orm import Session

from app.db import get_engine, get_session
from app.main import app
from app.seed import seed

# A fixed "now" makes every seeded timestamp, and so every sort order, predictable.
NOW = datetime(2026, 10, 1, 12, 0, tzinfo=UTC)


@pytest.fixture(scope="session")
def engine() -> Engine:
    # Tests drop and recreate every table, so refuse to touch anything but a test database.
    database = make_url(TEST_DATABASE_URL).database or ""
    if not database.endswith("_test"):
        raise RuntimeError(f"Refusing to run tests against '{database}'")

    # Build the schema with the real migrations, running down then up to prove both work.
    alembic = Config(toml_file="pyproject.toml")
    command.downgrade(alembic, "base")
    command.upgrade(alembic, "head")
    return get_engine()


@pytest.fixture
def session(engine: Engine) -> Iterator[Session]:
    # Each test runs inside one transaction that is rolled back at the end, so tests can't
    # affect each other. Endpoint commits become savepoints inside that transaction.
    with engine.connect() as connection:
        transaction = connection.begin()
        db = Session(bind=connection, join_transaction_mode="create_savepoint")
        seed(db, NOW)
        db.flush()
        yield db
        db.close()
        transaction.rollback()


@pytest.fixture
def client(session: Session) -> Iterator[TestClient]:
    # Endpoints receive the test's session instead of opening their own.
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()
