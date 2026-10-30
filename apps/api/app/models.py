import secrets
from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Text,
    func,
    select,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, column_property, mapped_column, relationship

from app.schemas import (
    ActivityKind,
    AnalysisStatus,
    DocumentType,
    MatterStatus,
    PracticeArea,
    ReviewStatus,
)

# Predictable names for indexes and constraints, so Alembic can find them in later migrations.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


def new_id(prefix: str) -> str:
    # e.g. "mat_3f9a1c2e": readable prefix + 8 random hex characters.
    return f"{prefix}_{secrets.token_hex(4)}"


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def str_enum(enum_class: type[StrEnum], name: str) -> Enum:
    # Store the enum's values ("in_review"), not its Python names ("IN_REVIEW"),
    # as VARCHAR with a CHECK constraint rather than a native Postgres ENUM type.
    return Enum(
        enum_class,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=32,
        values_callable=lambda members: [member.value for member in members],
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    initials: Mapped[str] = mapped_column(String(4))


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint("analysis_progress BETWEEN 0 AND 100", name="analysis_progress_range"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    matter_id: Mapped[str] = mapped_column(ForeignKey("matters.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[DocumentType] = mapped_column(str_enum(DocumentType, "document_type"))
    pages: Mapped[int] = mapped_column(Integer)
    uploaded_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    analysis_status: Mapped[AnalysisStatus] = mapped_column(
        str_enum(AnalysisStatus, "analysis_status")
    )
    analysis_progress: Mapped[int] = mapped_column(Integer, default=0)
    # Written once when analysis finishes. Null while analysing or after a failure.
    risk_high: Mapped[int | None] = mapped_column(Integer)
    risk_medium: Mapped[int | None] = mapped_column(Integer)
    risk_low: Mapped[int | None] = mapped_column(Integer)

    # The extracted text, always read and written as a whole, so it's stored as one JSON value.
    parties: Mapped[str | None] = mapped_column(String(500))
    sections: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list)

    uploaded_by: Mapped[User] = relationship()


class Matter(Base):
    __tablename__ = "matters"
    __table_args__ = (Index("ix_matters_org_id_last_activity_at", "org_id", "last_activity_at"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(200))
    client: Mapped[str] = mapped_column(String(200))
    practice_area: Mapped[PracticeArea] = mapped_column(str_enum(PracticeArea, "practice_area"))
    status: Mapped[MatterStatus] = mapped_column(str_enum(MatterStatus, "matter_status"))
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_activity_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Not a column: a subquery that runs as part of every SELECT on matters.
    document_count: Mapped[int] = column_property(
        select(func.count(Document.id))
        .where(Document.matter_id == id)
        .correlate_except(Document)
        .scalar_subquery()
    )

    owner: Mapped[User] = relationship()


class Clause(Base):
    __tablename__ = "clauses"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    # Order within the document. Sorting by section_ref as text would put "10.1" before "4.2".
    position: Mapped[int] = mapped_column(Integer)
    section_ref: Mapped[str] = mapped_column(String(16))
    clause_type: Mapped[str] = mapped_column(String(100))
    risk: Mapped[str] = mapped_column(String(16))
    explanation: Mapped[str] = mapped_column(Text)
    detail: Mapped[str] = mapped_column(Text)
    suggested_revision: Mapped[str | None] = mapped_column(Text)

    review_status: Mapped[ReviewStatus] = mapped_column(
        str_enum(ReviewStatus, "review_status"), default=ReviewStatus.UNREVIEWED
    )
    review_note: Mapped[str | None] = mapped_column(Text)
    reviewed_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    document: Mapped[Document] = relationship()
    reviewed_by: Mapped[User | None] = relationship()


class ActivityEvent(Base):
    __tablename__ = "activity_events"
    __table_args__ = (
        Index("ix_activity_events_matter_id_occurred_at", "matter_id", "occurred_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    matter_id: Mapped[str] = mapped_column(ForeignKey("matters.id", ondelete="CASCADE"))
    kind: Mapped[ActivityKind] = mapped_column(str_enum(ActivityKind, "activity_kind"))
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    description: Mapped[str] = mapped_column(String(500))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Declaring this relationship tells SQLAlchemy that events depend on matters,
    # so it always inserts pending matters before pending events.
    matter: Mapped[Matter] = relationship()
    actor: Mapped[User | None] = relationship()
