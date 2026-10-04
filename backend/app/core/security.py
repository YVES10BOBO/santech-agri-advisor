"""API key check for /ask (C4IR sends it in the X-API-Key header)."""
import logging
import secrets
from typing import Optional

from fastapi import Header, HTTPException, status

from app.config import get_settings

log = logging.getLogger(__name__)


def verify_api_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    expected = get_settings().api_access_key
    if not expected:
        return  # development mode: no key configured
    if not x_api_key or not secrets.compare_digest(x_api_key, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or missing API key.")
