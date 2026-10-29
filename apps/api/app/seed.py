"""Fill the database with the prototype's sample data: `python -m app.seed`."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app import models
from app.db import get_engine
from app.schemas import MatterStatus, PracticeArea

HARLOW = "org_harlow"
NORTHGATE = "org_northgate"
DEMO_USER = "usr_maya"

# id, name, initials
USERS = [
    ("usr_maya", "Maya Okafor", "MO"),
    ("usr_daniel", "Daniel Reyes", "DR"),
    ("usr_sana", "Sana Kapoor", "SK"),
    ("usr_tom", "Tom Becker", "TB"),
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


def seed(session: Session, now: datetime) -> None:
    # Children before parents: matters reference users, so they're deleted first.
    session.execute(delete(models.Matter))
    session.execute(delete(models.User))

    session.add_all(
        models.User(id=uid, name=name, initials=initials) for uid, name, initials in USERS
    )
    session.add_all(
        models.Matter(
            id=mid,
            org_id=org,
            name=name,
            client=client,
            practice_area=PracticeArea(area),
            status=MatterStatus(status),
            owner_id=owner,
            last_activity_at=now - timedelta(minutes=minutes_ago),
        )
        for mid, org, name, client, area, status, owner, minutes_ago in MATTERS
    )


def main() -> None:
    engine = get_engine()
    with Session(engine) as session:
        seed(session, datetime.now(UTC))
        session.commit()
    print(f"Seeded {len(USERS)} users and {len(MATTERS)} matters into {engine.url.database}")


if __name__ == "__main__":
    main()
