import re

from fastapi.testclient import TestClient

from app.deps import get_org_id
from app.main import app
from app.seed import NORTHGATE


def ids(response_json: dict[str, object]) -> list[str]:
    items = response_json["items"]
    assert isinstance(items, list)
    return [item["id"] for item in items]


def test_lists_only_the_current_orgs_matters_newest_first(client: TestClient) -> None:
    body = client.get("/matters").json()

    assert body["total"] == 9
    assert ids(body)[:3] == ["mat_1", "mat_4", "mat_5"]
    assert not {"mat_10", "mat_11", "mat_12"} & set(ids(body))


def test_includes_document_counts(client: TestClient) -> None:
    counts = {m["id"]: m["document_count"] for m in client.get("/matters").json()["items"]}

    assert counts["mat_1"] == 3
    assert counts["mat_6"] == 0


def test_searches_name_and_client_case_insensitively(client: TestClient) -> None:
    assert ids(client.get("/matters", params={"q": "lumen"}).json()) == ["mat_5"]
    assert ids(client.get("/matters", params={"q": "HALDEN PHARMA"}).json()) == ["mat_8"]


def test_search_treats_wildcards_as_text(client: TestClient) -> None:
    assert client.get("/matters", params={"q": "%"}).json()["total"] == 0
    assert client.get("/matters", params={"q": "_"}).json()["total"] == 0


def test_filters_by_status_and_practice_area(client: TestClient) -> None:
    body = client.get("/matters", params={"status": "in_review", "practice_area": "employment"})

    assert ids(body.json()) == ["mat_8"]


def test_sorts_statuses_in_workflow_order(client: TestClient) -> None:
    body = client.get("/matters", params={"sort": "status", "order": "asc", "page_size": 20})
    statuses = [m["status"] for m in body.json()["items"]]

    assert statuses == sorted(statuses, key=["open", "in_review", "closed"].index)


def test_paginates_without_overlap(client: TestClient) -> None:
    page_1 = client.get("/matters", params={"page": 1, "page_size": 4}).json()
    page_3 = client.get("/matters", params={"page": 3, "page_size": 4}).json()
    page_2 = client.get("/matters", params={"page": 2, "page_size": 4}).json()

    all_ids = ids(page_1) + ids(page_2) + ids(page_3)
    assert len(all_ids) == len(set(all_ids)) == 9


def test_invalid_query_returns_validation_errors(client: TestClient) -> None:
    response = client.get("/matters", params={"status": "archived", "page": 0})

    assert response.status_code == 422
    assert {d["field"] for d in response.json()["details"]} == {"query.status", "query.page"}


def test_misspelt_query_parameter_is_rejected(client: TestClient) -> None:
    response = client.get("/matters", params={"stauts": "open"})

    assert response.status_code == 422
    assert response.json()["details"][0]["field"] == "query.stauts"


def test_matter_in_another_org_is_not_found(client: TestClient) -> None:
    response = client.get("/matters/mat_10")

    assert response.status_code == 404
    assert response.json()["code"] == "not_found"
    assert re.fullmatch(r"CF-[0-9A-F]{4}-[0-9A-F]{2}", response.json()["reference"])


def test_the_other_org_sees_only_its_own_matters(client: TestClient) -> None:
    app.dependency_overrides[get_org_id] = lambda: NORTHGATE

    assert client.get("/matters").json()["total"] == 3
    assert client.get("/matters/mat_1").status_code == 404


def test_creates_a_matter_and_logs_it(client: TestClient) -> None:
    response = client.post(
        "/matters",
        json={"name": "  Vega Labs – NDA ", "client": "Vega Labs", "practice_area": "commercial"},
    )

    assert response.status_code == 201
    matter = response.json()
    assert matter["name"] == "Vega Labs – NDA"
    assert matter["status"] == "open"
    assert matter["owner"]["id"] == "usr_maya"
    activity = client.get(f"/matters/{matter['id']}/activity").json()
    assert [event["kind"] for event in activity] == ["created"]


def test_rejects_invalid_new_matters(client: TestClient) -> None:
    blank = {"name": "   ", "client": "Vega Labs", "practice_area": "commercial"}
    typo = {"nmae": "X", "name": "X", "client": "Vega Labs", "practice_area": "commercial"}

    assert client.post("/matters", json=blank).json()["details"][0]["field"] == "body.name"
    assert client.post("/matters", json=typo).json()["details"][0]["field"] == "body.nmae"


def test_patch_changes_only_the_fields_sent(client: TestClient) -> None:
    response = client.patch("/matters/mat_2", json={"status": "closed"})

    assert response.json()["status"] == "closed"
    assert response.json()["name"] == "Northwind – Senior hire contract"


def test_patch_rejects_null(client: TestClient) -> None:
    response = client.patch("/matters/mat_2", json={"name": None})

    assert response.status_code == 422
    assert response.json()["details"][0]["field"] == "body.name"


def test_unexpected_errors_are_hidden_but_referenced(client: TestClient) -> None:
    def broken() -> str:
        raise RuntimeError("simulated crash")

    app.dependency_overrides[get_org_id] = broken
    response = client.get("/matters")

    assert response.status_code == 500
    assert response.json()["message"] == "Something went wrong"
    assert "simulated crash" not in response.text
