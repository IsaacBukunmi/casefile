from dataclasses import dataclass, field
from datetime import datetime

from app.schemas import MatterStatus, Person, PracticeArea


@dataclass
class MatterRecord:
    id: str
    org_id: str  # which firm owns it; never sent to the client
    name: str
    client: str
    practice_area: PracticeArea
    status: MatterStatus
    owner_id: str  # stored as an ID; the API expands it into a Person
    last_activity_at: datetime


@dataclass
class Store:
    people: dict[str, Person] = field(default_factory=dict)
    matters: dict[str, MatterRecord] = field(default_factory=dict)
