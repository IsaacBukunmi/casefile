from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class Schema(BaseModel):
    # Reject unknown fields instead of silently dropping them.
    # A typo like {"nmae": ...} becomes an error, not a mystery.
    model_config = ConfigDict(extra="forbid")


class MatterStatus(StrEnum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    CLOSED = "closed"


class PracticeArea(StrEnum):
    COMMERCIAL = "commercial"
    EMPLOYMENT = "employment"
    REAL_ESTATE = "real_estate"
    TECHNOLOGY = "technology"
    CORPORATE = "corporate"
    PRIVACY = "privacy"


class Person(Schema):
    id: str
    name: str
    initials: str


class Matter(Schema):
    id: str
    name: str
    client: str
    practice_area: PracticeArea
    status: MatterStatus
    owner: Person  # models can nest; this becomes an object in the JSON
    document_count: int
    last_activity_at: datetime  # sent as an ISO 8601 string, e.g. "2026-10-27T09:30:00Z"


class MatterSort(StrEnum):
    NAME = "name"
    CLIENT = "client"
    STATUS = "status"
    LAST_ACTIVITY = "last_activity"


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class MatterPage(Schema):
    items: list[Matter]
    total: int = Field(description="Matters matching the filters, across all pages.")
    page: int
    page_size: int
