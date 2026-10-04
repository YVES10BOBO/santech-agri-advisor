"""GET /version – ties every benchmark score to a system, model and prompt version."""
from fastapi import APIRouter

from app.ai.prompts import PROMPT_VERSION
from app.config import get_settings
from app.schemas.common import VersionResponse

router = APIRouter(tags=["system"])


@router.get("/version", response_model=VersionResponse)
def version() -> VersionResponse:
    s = get_settings()
    return VersionResponse(system_version=s.system_version, model=s.openai_model,
                           embedding_model=s.openai_embedding_model,
                           prompt_version=PROMPT_VERSION)
