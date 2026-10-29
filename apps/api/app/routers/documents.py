from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app import models, schemas
from app.db import SessionDep
from app.deps import OrgId
from app.errors import ERROR_RESPONSES, NotFound
from app.routers.matters import get_matter_row

router = APIRouter(tags=["documents"], responses=ERROR_RESPONSES)


def to_document(row: models.Document) -> schemas.Document:
    ready = row.analysis_status == schemas.AnalysisStatus.READY
    return schemas.Document(
        id=row.id,
        matter_id=row.matter_id,
        name=row.name,
        file_type=row.file_type,
        pages=row.pages,
        uploaded_by=schemas.Person(
            id=row.uploaded_by.id, name=row.uploaded_by.name, initials=row.uploaded_by.initials
        ),
        uploaded_at=row.uploaded_at,
        analysis=schemas.Analysis(
            status=row.analysis_status,
            progress=row.analysis_progress,
            risk_counts=schemas.RiskCounts(
                high=row.risk_high or 0, medium=row.risk_medium or 0, low=row.risk_low or 0
            )
            if ready
            else None,
        ),
    )


@router.get("/matters/{matter_id}/documents")
def list_matter_documents(
    matter_id: str, session: SessionDep, org_id: OrgId
) -> list[schemas.Document]:
    get_matter_row(session, org_id, matter_id)  # 404 unless the matter is this org's
    stmt = (
        select(models.Document)
        .where(models.Document.matter_id == matter_id)
        .options(joinedload(models.Document.uploaded_by, innerjoin=True))
        .order_by(models.Document.uploaded_at.desc(), models.Document.id)
    )
    return [to_document(row) for row in session.scalars(stmt)]


@router.get("/documents/{document_id}")
def get_document(document_id: str, session: SessionDep, org_id: OrgId) -> schemas.DocumentDetail:
    # Join to matters so the org check happens in the same query as the lookup.
    stmt = (
        select(models.Document)
        .join(models.Matter, models.Document.matter_id == models.Matter.id)
        .where(models.Document.id == document_id, models.Matter.org_id == org_id)
        .options(joinedload(models.Document.uploaded_by, innerjoin=True))
    )
    row = session.scalars(stmt).one_or_none()
    if row is None:
        raise NotFound("Document")
    return schemas.DocumentDetail(
        **to_document(row).model_dump(),
        title=row.name.rsplit(".", 1)[0],
        parties=row.parties,
        sections=[schemas.Section.model_validate(section) for section in row.sections],
    )
