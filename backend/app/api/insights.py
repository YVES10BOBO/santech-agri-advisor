"""GET /insights - what farmers are asking, for MINAGRI/RAB (read-only, anonymous)."""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import verify_api_key
from app.db import insights
from app.db.database import get_pool

router = APIRouter(tags=["insights"])


@router.get("/insights", dependencies=[Depends(verify_api_key)])
def get_insights(days: int = Query(30, ge=1, le=365)) -> dict[str, Any]:
    if get_pool() is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE,
                            "Insights need the database (DATABASE_URL).")
    return insights.collect(days)
