from datetime import UTC, datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.db import SessionDep
from app.deps import OrgId, StoreDep
from app.schemas import Matter
from app.seed import build_store
from app.store import MatterRecord, Store

app = FastAPI(title="Casefile API", version="0.1.0")
app.state.store = build_store(datetime.now(UTC))

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_matter(store: Store, record: MatterRecord) -> Matter:
    # Converts the stored shape into the API shape.
    return Matter(
        id=record.id,
        name=record.name,
        client=record.client,
        practice_area=record.practice_area,
        status=record.status,
        owner=store.people[record.owner_id],
        document_count=0,
        last_activity_at=record.last_activity_at,
    )


@app.get("/health", tags=["meta"])
def health(session: SessionDep) -> dict[str, str]:
    # A trivial query proves the API can reach the database, not just that it's running.
    session.execute(text("select 1"))
    return {"status": "ok", "database": "ok"}


@app.get("/matters", tags=["matters"])
def list_matters(store: StoreDep, org_id: OrgId) -> list[Matter]:
    records = [m for m in store.matters.values() if m.org_id == org_id]
    records.sort(key=lambda m: m.last_activity_at, reverse=True)
    return [to_matter(store, m) for m in records]
