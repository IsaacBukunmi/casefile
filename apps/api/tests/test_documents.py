from fastapi.testclient import TestClient


def test_lists_a_matters_documents_newest_first(client: TestClient) -> None:
    docs = client.get("/matters/mat_1/documents").json()

    assert [d["id"] for d in docs] == ["doc_2", "doc_3", "doc_1"]
    assert docs[0]["analysis"] == {"status": "analysing", "progress": 58, "risk_counts": None}
    assert docs[2]["analysis"]["risk_counts"] == {"high": 2, "medium": 3, "low": 2}


def test_document_detail_includes_its_text(client: TestClient) -> None:
    doc = client.get("/documents/doc_1").json()

    assert doc["title"] == "Master Services Agreement"
    assert doc["sections"][0]["paragraphs"][0]["ref"] == "1.1"


def test_document_in_another_org_is_not_found(client: TestClient) -> None:
    assert client.get("/documents/doc_5").status_code == 404
    assert client.get("/matters/mat_10/documents").status_code == 404


def test_clauses_are_in_document_order(client: TestClient) -> None:
    clauses = client.get("/documents/doc_1/clauses").json()

    assert [c["section_ref"] for c in clauses] == [
        "4.2", "7.1", "9.3", "10.1", "12.1", "13.2", "15.1"
    ]  # fmt: skip


def test_flagging_keeps_the_note_and_logs_activity(client: TestClient) -> None:
    response = client.put(
        "/documents/doc_1/clauses/cls_2/review",
        json={"status": "flagged", "note": "  Push for a mutual cap. "},
    )

    review = response.json()["review"]
    assert review["status"] == "flagged"
    assert review["note"] == "Push for a mutual cap."
    assert review["reviewed_by"]["id"] == "usr_maya"
    latest = client.get("/matters/mat_1/activity").json()[0]
    assert latest["description"] == "flagged § 7.1 Limitation of liability"


def test_flagging_with_a_blank_note_stores_no_note(client: TestClient) -> None:
    response = client.put(
        "/documents/doc_1/clauses/cls_3/review", json={"status": "flagged", "note": "   "}
    )

    assert response.json()["review"]["note"] is None


def test_accepting_drops_the_note(client: TestClient) -> None:
    response = client.put(
        "/documents/doc_1/clauses/cls_1/review", json={"status": "accepted", "note": "ignored"}
    )

    assert response.json()["review"]["note"] is None


def test_resetting_to_unreviewed_clears_the_review(client: TestClient) -> None:
    response = client.put("/documents/doc_1/clauses/cls_6/review", json={"status": "unreviewed"})

    assert response.json()["review"] == {
        "status": "unreviewed",
        "note": None,
        "reviewed_by": None,
        "reviewed_at": None,
    }


def test_clause_must_belong_to_the_document(client: TestClient) -> None:
    response = client.put("/documents/doc_4/clauses/cls_1/review", json={"status": "accepted"})

    assert response.status_code == 404
    assert response.json()["message"] == "Clause not found"


def test_reviewing_moves_the_matter_to_the_top(client: TestClient) -> None:
    client.put("/documents/doc_1/clauses/cls_1/review", json={"status": "accepted"})
    client.patch("/matters/mat_7", json={"status": "open"})

    assert client.get("/matters").json()["items"][0]["id"] == "mat_7"
