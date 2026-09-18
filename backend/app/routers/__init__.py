"""Routers package initialization."""

from app.routers.reports import router as reports_router
from app.routers.verbal_autopsy import router as va_router
from app.routers.clusters import router as clusters_router
from app.routers.telegram import router as telegram_router
from app.routers.surveillance import router as surveillance_router
from app.routers.auth import router as auth_router

__all__ = ["reports_router", "va_router", "clusters_router", "telegram_router", "surveillance_router", "auth_router"]

