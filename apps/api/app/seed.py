"""Fill the database with the prototype's sample data: `python -m app.seed`."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app import models
from app.db import get_engine
from app.schemas import AnalysisStatus, DocumentType, MatterStatus, PracticeArea

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
    # Children before parents: documents reference matters, which reference users.
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


def main() -> None:
    engine = get_engine()
    with Session(engine) as session:
        seed(session, datetime.now(UTC))
        session.commit()
    print(
        f"Seeded {len(USERS)} users, {len(MATTERS)} matters and {len(DOCUMENTS)} documents "
        f"into {engine.url.database}"
    )


if __name__ == "__main__":
    main()
