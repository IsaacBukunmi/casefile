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


class MatterListParams(Schema):
    # Query parameters as one model: MISSING keeps the optional filters non-nullable, and
    # extra="forbid" (from Schema) turns a misspelt parameter into a 422, not a silent no-op.
    q: Annotated[str, Field(max_length=200, description="Search name or client")] | MISSING = (
        MISSING
    )
    status: MatterStatus | MISSING = MISSING
    practice_area: PracticeArea | MISSING = MISSING
    sort: MatterSort = MatterSort.LAST_ACTIVITY
    order: SortOrder = SortOrder.DESC
    page: Annotated[int, Field(ge=1)] = 1
    page_size: Annotated[int, Field(ge=1, le=100)] = 10


class MatterPage(Schema):
    items: list[Matter]
    total: int = Field(description="Matters matching the filters, across all pages.")
    page: int
    page_size: int


class DocumentType(StrEnum):
    PDF = "pdf"
    DOCX = "docx"


class AnalysisStatus(StrEnum):
    ANALYSING = "analysing"
    READY = "ready"
    FAILED = "failed"


class RiskCounts(Schema):
    high: int
    medium: int
    low: int


class Analysis(Schema):
    status: AnalysisStatus
    progress: int = Field(ge=0, le=100)
    risk_counts: RiskCounts | None = Field(description="Present only when status is 'ready'.")


class Document(Schema):
    id: str
    matter_id: str
    name: str
    file_type: DocumentType
    pages: int
    uploaded_by: Person
    uploaded_at: datetime
    analysis: Analysis


class Paragraph(Schema):
    ref: str = Field(description="Clause reference shown in the margin, e.g. '7.1'.")
    text: str


class Section(Schema):
    number: str
    title: str
    paragraphs: list[Paragraph]


class DocumentDetail(Document):
    title: str
    parties: str | None
    sections: list[Section]


class ReviewStatus(StrEnum):
    UNREVIEWED = "unreviewed"
    ACCEPTED = "accepted"
    FLAGGED = "flagged"


class Review(Schema):
    status: ReviewStatus
    note: str | None
    reviewed_by: Person | None
    reviewed_at: datetime | None


class Clause(Schema):
    id: str
    document_id: str
    section_ref: str
    clause_type: str
    risk: str
    explanation: str
    detail: str
    suggested_revision: str | None
    review: Review


Note = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]


class ReviewUpdate(Schema):
    status: ReviewStatus
    note: Note | MISSING = Field(default=MISSING, description="Only kept when status is 'flagged'.")


class ActivityKind(StrEnum):
    CREATED = "created"
    EDITED = "edited"
    UPLOADED = "uploaded"
    ANALYSIS_READY = "analysis_ready"
    ACCEPTED = "accepted"
    FLAGGED = "flagged"
    ASKED = "asked"


class ActivityEvent(Schema):
    id: str
    matter_id: str
    kind: ActivityKind
    actor: Person | None = Field(description="Null for system events, such as finished analysis.")
    description: str
    occurred_at: datetime


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
    details: list[FieldError] | None
