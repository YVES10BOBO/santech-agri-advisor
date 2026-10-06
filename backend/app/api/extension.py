"""Extension officer tools: field records, escalations to MINAGRI/RAB, knowledge refresher.

The second opinion on a sick plant uses POST /ask-image; the refresher uses POST /ask.
"""
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from psycopg.errors import UndefinedTable

from app.core.security import verify_api_key
from app.db import extension as db
from app.db.database import get_pool
from app.schemas.extension import EscalationIn, EscalationUpdate, FieldRecordIn

router = APIRouter(prefix="/extension", tags=["extension"],
                   dependencies=[Depends(verify_api_key)])


def _need_db() -> None:
    if get_pool() is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE,
                            "Extension tools need the database (DATABASE_URL).")


def _run(fn, *args):
    _need_db()
    try:
        return fn(*args)
    except UndefinedTable:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE,
                            "Run database/migrations/004_extension_tables.sql first.")


def _officer(name: Optional[str]) -> Optional[str]:
    return name.strip() if name and name.strip() else None


@router.get("/summary")
def get_summary(officer: Optional[str] = Query(None, max_length=60)) -> dict[str, Any]:
    return _run(db.summary, _officer(officer))


@router.get("/records")
def get_records(officer: Optional[str] = Query(None, max_length=60),
                limit: int = Query(50, ge=1, le=500)) -> list[dict[str, Any]]:
    return _run(db.list_records, _officer(officer), limit)


@router.post("/records", status_code=status.HTTP_201_CREATED)
def post_record(body: FieldRecordIn) -> dict[str, Any]:
    rec = body.model_dump()
    rec["officer"] = rec["officer"].strip()
    return _run(db.add_record, rec)


@router.get("/escalations")
def get_escalations(officer: Optional[str] = Query(None, max_length=60),
                    status_: Optional[Literal["open", "reviewing", "resolved"]] =
                    Query(None, alias="status"),
                    limit: int = Query(50, ge=1, le=500)) -> list[dict[str, Any]]:
    return _run(db.list_escalations, _officer(officer), status_, limit)


@router.post("/escalations", status_code=status.HTTP_201_CREATED)
def post_escalation(body: EscalationIn) -> dict[str, Any]:
    rec = body.model_dump()
    rec["officer"] = rec["officer"].strip()
    return _run(db.add_escalation, rec)


@router.patch("/escalations/{escalation_id}")
def patch_escalation(escalation_id: int, body: EscalationUpdate) -> dict[str, Any]:
    row = _run(db.update_escalation, escalation_id, body.status, body.response)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Escalation not found.")
    return row


@router.get("/knowledge")
def get_knowledge() -> list[dict[str, Any]]:
    return _run(db.knowledge_documents)
