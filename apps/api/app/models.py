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
    func,
    select,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, column_property, mapped_column, relationship

from app.schemas import AnalysisStatus, DocumentType, MatterStatus, PracticeArea

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
