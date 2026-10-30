from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from sqlalchemy import text

from app.config import get_settings
from app.db import SessionDep
from app.errors import register_error_handlers
from app.routers import documents, matters


def operation_id(route: APIRoute) -> str:
    # Name each operation after its function ("list_matters") instead of FastAPI's
    # default ("list_matters_matters_get"). These names reach the generated TypeScript.
    return route.name


app = FastAPI(title="Casefile API", version="0.1.0", generate_unique_id_function=operation_id)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)
app.include_router(matters.router)
app.include_router(documents.router)


@app.get("/health", tags=["meta"])
def health(session: SessionDep) -> dict[str, str]:
    session.execute(text("select 1"))
    return {"status": "ok", "database": "ok"}
