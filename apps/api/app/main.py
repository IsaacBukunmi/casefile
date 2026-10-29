from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import joinedload

from app import models, schemas
from app.config import get_settings
from app.db import SessionDep
from app.deps import OrgId

app = FastAPI(title="Casefile API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_matter(row: models.Matter) -> schemas.Matter:
    return schemas.Matter(
        id=row.id,
        name=row.name,
        client=row.client,
        practice_area=row.practice_area,
        status=row.status,
        owner=schemas.Person(id=row.owner.id, name=row.owner.name, initials=row.owner.initials),
        document_count=0,  # becomes a real count once documents exist (3.7)
        last_activity_at=row.last_activity_at,
    )


@app.get("/health", tags=["meta"])
def health(session: SessionDep) -> dict[str, str]:
    session.execute(text("select 1"))
    return {"status": "ok", "database": "ok"}


@app.get("/matters", tags=["matters"])
def list_matters(session: SessionDep, org_id: OrgId) -> list[schemas.Matter]:
    stmt = (
        select(models.Matter)
        .where(models.Matter.org_id == org_id)
        .options(joinedload(models.Matter.owner))
        .order_by(models.Matter.last_activity_at.desc())
    )
    return [to_matter(row) for row in session.scalars(stmt)]
