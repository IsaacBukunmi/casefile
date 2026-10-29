from typing import Annotated

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import ColumnElement, case, func, or_, select, text
from sqlalchemy.orm import joinedload

from app import models, schemas
from app.config import get_settings
from app.db import SessionDep
from app.deps import OrgId
from app.errors import ERROR_RESPONSES, NotFound, register_error_handlers

app = FastAPI(title="Casefile API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)


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


def matter_filters(
    org_id: str,
    q: str | None,
    status: schemas.MatterStatus | None,
    area: schemas.PracticeArea | None,
) -> list[ColumnElement[bool]]:
    conditions = [models.Matter.org_id == org_id]
    if q:
        # Escape the LIKE wildcards so a search for "50%" means the text "50%".
        escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        conditions.append(
            or_(
                models.Matter.name.ilike(pattern, escape="\\"),
                models.Matter.client.ilike(pattern, escape="\\"),
            )
        )
    if status:
        conditions.append(models.Matter.status == status)
    if area:
        conditions.append(models.Matter.practice_area == area)
    return conditions


SORT_COLUMNS = {
    schemas.MatterSort.NAME: func.lower(models.Matter.name),
    schemas.MatterSort.CLIENT: func.lower(models.Matter.client),
    # Sort statuses in workflow order (open, in review, closed), not alphabetically.
    schemas.MatterSort.STATUS: case(
        {"open": 0, "in_review": 1, "closed": 2}, value=models.Matter.status
    ),
    schemas.MatterSort.LAST_ACTIVITY: models.Matter.last_activity_at,
}


@app.get("/matters", tags=["matters"], responses=ERROR_RESPONSES)
def list_matters(
    session: SessionDep,
    org_id: OrgId,
    q: Annotated[str | None, Query(max_length=200, description="Search name or client")] = None,
    status: schemas.MatterStatus | None = None,
    practice_area: schemas.PracticeArea | None = None,
    sort: schemas.MatterSort = schemas.MatterSort.LAST_ACTIVITY,
    order: schemas.SortOrder = schemas.SortOrder.DESC,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
) -> schemas.MatterPage:
    conditions = matter_filters(org_id, q, status, practice_area)

    total = session.scalar(select(func.count()).select_from(models.Matter).where(*conditions))

    sort_column = SORT_COLUMNS[sort]
    direction = sort_column.desc() if order == schemas.SortOrder.DESC else sort_column.asc()
    stmt = (
        select(models.Matter)
        .where(*conditions)
        .options(joinedload(models.Matter.owner, innerjoin=True))
        # The id tie-breaker keeps the order stable when two rows share a sort value,
        # so a matter never appears on two pages or on none.
        .order_by(direction, models.Matter.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return schemas.MatterPage(
        items=[to_matter(row) for row in session.scalars(stmt)],
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@app.get("/matters/{matter_id}", tags=["matters"], responses=ERROR_RESPONSES)
def get_matter(matter_id: str, session: SessionDep, org_id: OrgId) -> schemas.Matter:
    stmt = (
        select(models.Matter)
        .where(models.Matter.id == matter_id, models.Matter.org_id == org_id)
        .options(joinedload(models.Matter.owner, innerjoin=True))
    )
    row = session.scalars(stmt).one_or_none()
    if row is None:
        raise NotFound("Matter")
    return to_matter(row)
