"""Models for /health and /version."""
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str            # "ok" when ready to answer
    ready: bool
    llm_configured: bool
    database: str          # connected | not_configured | error
    system_version: str


class VersionResponse(BaseModel):
    system_version: str
    model: str
    embedding_model: str
    prompt_version: str
