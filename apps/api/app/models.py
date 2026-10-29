import secrets
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Index, MetaData, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.schemas import MatterStatus, PracticeArea

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

    owner: Mapped[User] = relationship()
