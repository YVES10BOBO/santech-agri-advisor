"""FastAPI application entry point.

Run from the backend/ folder:  uvicorn app.main:app --reload
Interactive API docs:           http://localhost:8000/docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ask, ask_image, health, speak, transcribe, version
from app.channels import sms, ussd
from app.config import get_settings
from app.core.logger import setup_logging
from app.db.database import close_pool, init_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    init_pool()
    yield
    close_pool()


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version=settings.system_version,
    description="Kinyarwanda-first agricultural advisory API for Rwandan smallholder farmers.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)
app.include_router(health.router)
app.include_router(version.router)
app.include_router(ask.router)
app.include_router(ask_image.router)
app.include_router(transcribe.router)
app.include_router(speak.router)
app.include_router(ussd.router)
app.include_router(sms.router)
