"""GET /health – C4IR checks this before each benchmark run."""
from fastapi import APIRouter

from app.config import get_settings
from app.db.database import database_status
from app.schemas.common import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    s = get_settings()
    db = database_status()
    llm_ok = bool(s.openai_api_key)
    ready = llm_ok and db in ("connected", "not_configured")
    return HealthResponse(status="ok" if ready else "degraded", ready=ready,
                          llm_configured=llm_ok, database=db,
                          system_version=s.system_version)
