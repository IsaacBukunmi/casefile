from datetime import datetime, timedelta

from app.schemas import MatterStatus, Person, PracticeArea
from app.store import MatterRecord, Store

HARLOW = "org_harlow"
NORTHGATE = "org_northgate"
DEMO_USER = "usr_maya"

PEOPLE = [
    Person(id="usr_maya", name="Maya Okafor", initials="MO"),
    Person(id="usr_daniel", name="Daniel Reyes", initials="DR"),
    Person(id="usr_sana", name="Sana Kapoor", initials="SK"),
    Person(id="usr_tom", name="Tom Becker", initials="TB"),
]

# id, org, name, client, practice area, status, owner, minutes since last activity
MATTERS = [
    ("mat_1", HARLOW, "Acme Ltd – Supplier agreement", "Acme Ltd", "commercial", "in_review", "usr_maya", 12),
    ("mat_2", HARLOW, "Northwind – Senior hire contract", "Northwind Health", "employment", "open", "usr_daniel", 1500),
    ("mat_3", HARLOW, "Brightwater – Office lease renewal", "Brightwater Co.", "real_estate", "closed", "usr_sana", 30200),
    ("mat_4", HARLOW, "Kestrel Foods – Distribution deal", "Kestrel Foods", "commercial", "open", "usr_maya", 130),
    ("mat_5", HARLOW, "Lumen – SaaS licence", "Lumen Analytics", "technology", "in_review", "usr_tom", 300),
    ("mat_6", HARLOW, "Fenwick – Shareholder agreement", "Fenwick & Daughters", "corporate", "open", "usr_sana", 4400),
    ("mat_7", HARLOW, "Orbital Studio – Contractor NDA", "Orbital Studio", "commercial", "closed", "usr_daniel", 49000),
    ("mat_8", HARLOW, "Halden Pharma – Executive severance", "Halden Pharma", "employment", "in_review", "usr_maya", 360),
    ("mat_9", HARLOW, "Pike Logistics – Warehouse lease", "Pike Logistics", "real_estate", "open", "usr_tom", 13000),
    ("mat_10", NORTHGATE, "Cloud hosting MSA", "Northgate Group", "technology", "in_review", "usr_maya", 40),
    ("mat_11", NORTHGATE, "Marketing agency SOW", "Northgate Group", "commercial", "open", "usr_maya", 2900),
    ("mat_12", NORTHGATE, "Data processing addendum", "Northgate Group", "privacy", "closed", "usr_daniel", 21600),
]  # fmt: skip


def build_store(now: datetime) -> Store:
    store = Store()
    store.people = {person.id: person for person in PEOPLE}

    for mid, org, name, client, area, status, owner, minutes_ago in MATTERS:
        store.matters[mid] = MatterRecord(
            id=mid,
            org_id=org,
            name=name,
            client=client,
            practice_area=PracticeArea(area),  # converts the string, and fails loudly on a typo
            status=MatterStatus(status),
            owner_id=owner,
            last_activity_at=now - timedelta(minutes=minutes_ago),
        )
    return store
