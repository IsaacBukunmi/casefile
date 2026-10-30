"""Fill the database with the prototype's sample data: `python -m app.seed`."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app import models
from app.db import get_engine
from app.schemas import (
    ActivityKind,
    AnalysisStatus,
    DocumentType,
    MatterStatus,
    PracticeArea,
    ReviewStatus,
)

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


# id, matter, name, type, pages, uploaded by, minutes ago, status, progress, (high, medium, low)
DOCUMENTS = [
    ("doc_1", "mat_1", "Master Services Agreement.pdf", "pdf", 22, "usr_maya", 120, "ready", 100, (2, 3, 2)),
    ("doc_2", "mat_1", "Schedule 1 – Specification.docx", "docx", 6, "usr_daniel", 4, "analysing", 58, None),
    ("doc_3", "mat_1", "Pricing annex.pdf", "pdf", 4, "usr_maya", 30, "failed", 0, None),
    ("doc_4", "mat_4", "Distribution agreement v2.pdf", "pdf", 31, "usr_maya", 130, "ready", 100, (1, 4, 6)),
    ("doc_5", "mat_10", "Cloud hosting MSA.pdf", "pdf", 40, "usr_maya", 40, "ready", 100, (3, 2, 9)),
    ("doc_6", "mat_2", "Employment contract – J. Park.docx", "docx", 12, "usr_daniel", 1500, "ready", 100, (1, 2, 5)),
    ("doc_7", "mat_5", "Lumen SaaS terms.pdf", "pdf", 18, "usr_tom", 300, "ready", 100, (2, 4, 7)),
    ("doc_8", "mat_5", "Lumen DPA.pdf", "pdf", 9, "usr_tom", 310, "ready", 100, (0, 1, 6)),
    ("doc_9", "mat_3", "Lease renewal – final.pdf", "pdf", 27, "usr_sana", 30200, "ready", 100, (0, 2, 8)),
    ("doc_10", "mat_8", "Severance agreement.docx", "docx", 8, "usr_maya", 360, "ready", 100, (2, 1, 3)),
    ("doc_11", "mat_11", "Agency SOW.pdf", "pdf", 5, "usr_maya", 2900, "ready", 100, (0, 2, 3)),
    ("doc_12", "mat_12", "DPA – signed.pdf", "pdf", 11, "usr_daniel", 21600, "ready", 100, (0, 0, 5)),
]  # fmt: skip

# The Master Services Agreement's text: (section number, title, [(ref, text), ...])
MSA_SECTIONS = [
    ("1", "Definitions", [
        ("1.1", "“Agreement” means these terms together with each Order Form signed by the parties. “Services” means the supply of packaging materials described in Schedule 1."),
    ]),
    ("2", "Term", [
        ("2.1", "This Agreement starts on the Effective Date and continues for an initial term of twenty-four (24) months, unless terminated earlier under clause 9."),
    ]),
    ("4", "Fees and payment", [
        ("4.1", "The Client shall pay the Fees set out in the Order Form within thirty (30) days of the date of a valid invoice."),
        ("4.2", "Any amount not paid when due shall accrue interest at a rate of four per cent (4%) per month, calculated daily and compounded monthly, from the due date until payment in full."),
    ]),
    ("7", "Liability", [
        ("7.1", "The Supplier’s total aggregate liability arising under or in connection with this Agreement shall not exceed the Fees paid by the Client in the three (3) months preceding the claim. Nothing in this Agreement limits the Client’s liability to the Supplier."),
        ("7.2", "Neither party excludes liability for death or personal injury caused by its negligence, or for fraud."),
    ]),
    ("9", "Termination", [
        ("9.1", "Either party may terminate this Agreement immediately by written notice if the other commits a material breach that is not remedied within thirty (30) days of being notified of it."),
        ("9.3", "The Supplier may terminate this Agreement for convenience at any time by giving the Client not less than seven (7) days’ written notice."),
    ]),
    ("10", "Indemnity", [
        ("10.1", "The Client shall indemnify the Supplier against all losses, claims and costs howsoever arising in connection with the Services, including where caused by the Supplier’s own negligence."),
    ]),
    ("12", "Renewal", [
        ("12.1", "On expiry of the initial term, this Agreement renews automatically for successive periods of twenty-four (24) months unless either party gives notice of non-renewal at least ninety (90) days before the end of the then-current term."),
    ]),
    ("13", "Confidentiality", [
        ("13.2", "Each party shall keep the other’s Confidential Information secret for the term of this Agreement and for three (3) years after termination."),
    ]),
    ("15", "Governing law", [
        ("15.1", "This Agreement is governed by the laws of England and Wales, and the courts of England have exclusive jurisdiction."),
    ]),
]  # fmt: skip


# The AI's findings for the Master Services Agreement, in document order:
# id, section, clause type, risk, explanation, detail, suggested revision, review status
MSA_CLAUSES = [
    ("cls_1", "4.2", "Late payment interest", "med",
     "Interest of 4% a month — roughly 48% a year, far above market.",
     "Compounded monthly with no grace period. A single delayed invoice could grow quickly; courts may also treat this as a penalty.",
     "Late payments accrue interest at 1% per month above the Bank of England base rate, after a 15-day grace period.",
     "unreviewed"),
    ("cls_2", "7.1", "Limitation of liability", "high",
     "Your client’s liability is uncapped, while the supplier’s is limited to 3 months of fees.",
     "The cap only protects the supplier. A product defect claim against your client could exceed the whole contract value.",
     "Each party’s total aggregate liability shall not exceed the Fees paid in the twelve (12) months preceding the claim.",
     "unreviewed"),
    ("cls_3", "9.3", "Termination for convenience", "high",
     "The supplier can walk away on 7 days’ notice. Your client has no equivalent right.",
     "Seven days is too short to find a replacement packaging supplier and the right is one-sided.",
     "Either party may terminate this Agreement for convenience by giving not less than sixty (60) days’ written notice.",
     "unreviewed"),
    ("cls_4", "10.1", "Indemnity", "med",
     "Your client indemnifies the supplier even for the supplier’s own negligence.",
     "“Howsoever arising” makes the indemnity very broad. Indemnities should follow fault.",
     "Each party shall indemnify the other against losses to the extent caused by its breach of this Agreement or negligence.",
     "unreviewed"),
    ("cls_5", "12.1", "Automatic renewal", "med",
     "Renews for 24 more months unless cancelled 90 days before the term ends.",
     "Long renewal periods with an early notice window are easy to miss and lock the client in.",
     "This Agreement renews for successive periods of twelve (12) months unless either party gives thirty (30) days’ notice.",
     "unreviewed"),
    ("cls_6", "13.2", "Confidentiality", "low",
     "Standard mutual obligations lasting 3 years after termination.",
     "Mutual and time-limited. In line with market practice for supply agreements.",
     None, "accepted"),
    ("cls_7", "15.1", "Governing law", "low",
     "English law and courts — consistent with your client’s location.",
     "No conflict with your client’s jurisdiction.",
     None, "accepted"),
]  # fmt: skip

# Acme's history, as shown in the prototype: matter, kind, actor (None = system), text, minutes ago
ACME_ACTIVITY = [
    ("mat_1", "created", "usr_maya", "created the matter", 1440),
    ("mat_1", "uploaded", "usr_maya", "uploaded Master Services Agreement.pdf", 120),
    ("mat_1", "analysis_ready", None, "Analysis finished for Master Services Agreement.pdf", 115),
    ("mat_1", "accepted", "usr_maya", "accepted § 13.2 Confidentiality", 95),
    ("mat_1", "asked", "usr_daniel", "asked “Can we end this contract early?”", 60),
    ("mat_1", "flagged", "usr_maya", "flagged § 7.1 Limitation of liability", 12),
]


def msa_sections() -> list[dict[str, object]]:
    return [
        {
            "number": number,
            "title": title,
            "paragraphs": [{"ref": ref, "text": text} for ref, text in paragraphs],
        }
        for number, title, paragraphs in MSA_SECTIONS
    ]


def seed(session: Session, now: datetime) -> None:
    # Children before parents: clauses -> documents -> matters -> users.
    session.execute(delete(models.ActivityEvent))
    session.execute(delete(models.Clause))
    session.execute(delete(models.Document))
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
    # Flush sends the pending users and matters to Postgres now, so the documents'
    # foreign keys have rows to point at. Nothing is committed yet.
    session.flush()
    session.add_all(
        models.Document(
            id=did,
            matter_id=mid,
            name=name,
            file_type=DocumentType(ftype),
            pages=pages,
            uploaded_by_id=by,
            uploaded_at=now - timedelta(minutes=minutes_ago),
            analysis_status=AnalysisStatus(status),
            analysis_progress=progress,
            risk_high=counts[0] if counts else None,
            risk_medium=counts[1] if counts else None,
            risk_low=counts[2] if counts else None,
            parties="Between Brightline Packaging Ltd and Acme Ltd" if did == "doc_1" else None,
            sections=msa_sections() if did == "doc_1" else [],
        )
        for did, mid, name, ftype, pages, by, minutes_ago, status, progress, counts in DOCUMENTS
    )
    session.flush()
    session.add_all(
        models.Clause(
            id=cid,
            document_id="doc_1",
            position=position,
            section_ref=section,
            clause_type=ctype,
            risk=risk,
            explanation=explanation,
            detail=detail,
            suggested_revision=revision,
            review_status=ReviewStatus(review),
            reviewed_by_id="usr_maya" if review != "unreviewed" else None,
            reviewed_at=now - timedelta(minutes=95) if review != "unreviewed" else None,
        )
        for position, (
            cid,
            section,
            ctype,
            risk,
            explanation,
            detail,
            revision,
            review,
        ) in enumerate(MSA_CLAUSES)
    )
    _seed_activity(session, now)


def _seed_activity(session: Session, now: datetime) -> None:
    events = [
        (mid, kind, actor, text, now - timedelta(minutes=minutes))
        for mid, kind, actor, text, minutes in ACME_ACTIVITY
    ]
    # Every other matter gets a "created" event, plus one "uploaded" event per document.
    for mid, _, _, _, _, _, owner, minutes_ago in MATTERS:
        if mid == "mat_1":
            continue
        events.append(
            (mid, "created", owner, "created the matter", now - timedelta(minutes=minutes_ago + 60))
        )
    for _, mid, name, _, _, by, minutes_ago, _, _, _ in DOCUMENTS:
        if mid != "mat_1":
            events.append(
                (mid, "uploaded", by, f"uploaded {name}", now - timedelta(minutes=minutes_ago))
            )

    session.add_all(
        models.ActivityEvent(
            id=f"act_{index}",
            matter_id=mid,
            kind=ActivityKind(kind),
            actor_id=actor,
            description=text,
            occurred_at=at,
        )
        for index, (mid, kind, actor, text, at) in enumerate(events, start=1)
    )


def main() -> None:
    engine = get_engine()
    with Session(engine) as session:
        seed(session, datetime.now(UTC))
        session.commit()
    print(
        f"Seeded {len(USERS)} users, {len(MATTERS)} matters, {len(DOCUMENTS)} documents "
        f"and {len(MSA_CLAUSES)} clauses into {engine.url.database}"
    )


if __name__ == "__main__":
    main()
