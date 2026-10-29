from datetime import datetime
from enum import StrEnum
from typing import Annotated

from pydantic import MISSING, BaseModel, ConfigDict, Field, StringConstraints


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


# Trims surrounding spaces first, so "   " counts as empty and is rejected.
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]


class MatterCreate(Schema):
    name: Name
    client: Name
    practice_area: PracticeArea
    status: MatterStatus = MatterStatus.OPEN


class MatterUpdate(Schema):
    # MISSING means "not sent": the field is optional, but null is never accepted.
    name: Name | MISSING = MISSING
    client: Name | MISSING = MISSING
    practice_area: PracticeArea | MISSING = MISSING
    status: MatterStatus | MISSING = MISSING


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


class ErrorCode(StrEnum):
    BAD_REQUEST = "bad_request"
    UNAUTHORIZED = "unauthorized"
    FORBIDDEN = "forbidden"
    NOT_FOUND = "not_found"
    VALIDATION_ERROR = "validation_error"
    INTERNAL_ERROR = "internal_error"


class FieldError(Schema):
    field: str = Field(description="Where the problem is, e.g. 'query.status' or 'body.name'.")
    message: str


class ApiError(Schema):
    code: ErrorCode
    message: str
    reference: str = Field(description="Short code a user can quote to support, e.g. CF-4F1A-02.")
    details: list[FieldError] | None = None
