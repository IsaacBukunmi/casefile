from datetime import UTC, datetime

from fastapi import APIRouter
from pydantic import MISSING
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.activity import record_activity, to_person
from app.db import SessionDep
from app.deps import OrgId, UserId
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
        uploaded_by=to_person(row.uploaded_by),
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


def get_document_row(session: Session, org_id: str, document_id: str) -> models.Document:
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
    return row


@router.get("/documents/{document_id}")
def get_document(document_id: str, session: SessionDep, org_id: OrgId) -> schemas.DocumentDetail:
    row = get_document_row(session, org_id, document_id)
    return schemas.DocumentDetail(
        **to_document(row).model_dump(),
        title=row.name.rsplit(".", 1)[0],
        parties=row.parties,
        sections=[schemas.Section.model_validate(section) for section in row.sections],
    )


def to_clause(row: models.Clause) -> schemas.Clause:
    return schemas.Clause(
        id=row.id,
        document_id=row.document_id,
        section_ref=row.section_ref,
        clause_type=row.clause_type,
        risk=row.risk,
        explanation=row.explanation,
        detail=row.detail,
        suggested_revision=row.suggested_revision,
        review=schemas.Review(
            status=row.review_status,
            note=row.review_note,
            reviewed_by=to_person(row.reviewed_by) if row.reviewed_by else None,
            reviewed_at=row.reviewed_at,
        ),
    )


@router.get("/documents/{document_id}/clauses")
def list_document_clauses(
    document_id: str, session: SessionDep, org_id: OrgId
) -> list[schemas.Clause]:
    get_document_row(session, org_id, document_id)
    stmt = (
        select(models.Clause)
        .where(models.Clause.document_id == document_id)
        .options(joinedload(models.Clause.reviewed_by))
        .order_by(models.Clause.position)
    )
    return [to_clause(row) for row in session.scalars(stmt)]


@router.put("/documents/{document_id}/clauses/{clause_id}/review")
def review_clause(
    document_id: str,
    clause_id: str,
    body: schemas.ReviewUpdate,
    session: SessionDep,
    org_id: OrgId,
    user_id: UserId,
) -> schemas.Clause:
    document = get_document_row(session, org_id, document_id)
    clause = session.get(models.Clause, clause_id)
    if clause is None or clause.document_id != document.id:
        raise NotFound("Clause")

    clause.review_status = body.status
    if body.status == schemas.ReviewStatus.UNREVIEWED:
        clause.review_note = None
        clause.reviewed_by_id = None
        clause.reviewed_at = None
    else:
        flagged = body.status == schemas.ReviewStatus.FLAGGED
        # Keep a note only on flagged clauses, and store an empty note as no note.
        clause.review_note = (body.note or None) if flagged and body.note is not MISSING else None
        clause.reviewed_by_id = user_id
        clause.reviewed_at = datetime.now(UTC)

        matter = session.get_one(models.Matter, document.matter_id)
        kind = schemas.ActivityKind.FLAGGED if flagged else schemas.ActivityKind.ACCEPTED
        record_activity(
            session,
            matter,
            kind,
            user_id,
            f"{kind.value} § {clause.section_ref} {clause.clause_type}",
        )

    session.commit()
    return to_clause(clause)
