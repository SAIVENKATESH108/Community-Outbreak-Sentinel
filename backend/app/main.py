"""Community Outbreak Sentinel - Main FastAPI Application."""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import clusters_router, reports_router, telegram_router, va_router, surveillance_router, auth_router

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("sentinel.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Community Outbreak Sentinel API...")
    logger.info("Environment: %s | Supabase Endpoint: %s", settings.ENVIRONMENT, settings.SUPABASE_URL)
    yield
    logger.info("Shutting down Community Outbreak Sentinel API...")


app = FastAPI(
    title="Community Outbreak Sentinel",
    description="Early syndromic epidemic detection & spatiotemporal outbreak surveillance system.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React dashboard and mobile web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(reports_router)
app.include_router(va_router)
app.include_router(clusters_router)
app.include_router(telegram_router)
app.include_router(surveillance_router)
app.include_router(auth_router)



@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "community-outbreak-sentinel",
        "supabase_connected": True,
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "name": "Community Outbreak Sentinel API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "voice_reporting": "/api/v1/reports/voice",
            "icon_reporting": "/api/v1/reports/icon-app",
            "verbal_autopsy": "/api/v1/verbal-autopsy",
            "active_clusters": "/api/v1/clusters/active",
            "manual_detection_sweep": "/api/v1/clusters/run-detection"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)