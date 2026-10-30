from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app import models, schemas


def record_activity(
    session: Session,
    matter: models.Matter,
    kind: schemas.ActivityKind,
    actor_id: str | None,
    description: str,
) -> None:
    # Adds the event and bumps the matter's "last activity", in the caller's transaction.
    now = datetime.now(UTC)
    session.add(
        models.ActivityEvent(
            id=models.new_id("act"),
            matter=matter,
            kind=kind,
            actor_id=actor_id,
            description=description,
            occurred_at=now,
        )
    )
    matter.last_activity_at = now


def to_person(user: models.User) -> schemas.Person:
    return schemas.Person(id=user.id, name=user.name, initials=user.initials)
