"""API Routes for Surveillance Symptom Reporting."""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request, status
from app.core.database import get_db, SupabaseClient
from app.models.symptom_report import (
    IconReportCreate,
    ReportChannel,
    ReporterType,
    SymptomReportResponse,
    SymptomStage,
    VoiceReportCreate
)
from app.services.gemini_service import GeminiService, get_gemini_service
from app.services.telegram_alert_service import TelegramAlertService, get_telegram_service
from app.routers.telegram import process_telegram_update

logger = logging.getLogger("sentinel.reports")

router = APIRouter(prefix="/api/v1/reports", tags=["Symptom Reports"])


@router.post("/voice", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def submit_voice_report(
    request: Request,
    db: SupabaseClient = Depends(get_db),
    gemini: GeminiService = Depends(get_gemini_service),
    telegram: TelegramAlertService = Depends(get_telegram_service)
):
    """
    Submits a vernacular voice transcription or raw text note.
    Also acts as a Telegram webhook receiver when receiving Telegram updates.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    # 1. Detect if this is a Telegram Webhook Update
    if "update_id" in body or "message" in body:
        logger.info("Handling incoming Telegram webhook update at /reports/voice")
        return await process_telegram_update(body, db, gemini, telegram)

    # 2. Otherwise handle direct JSON payload
    try:
        payload = VoiceReportCreate(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Extract syndromic features with Gemini
    extraction = gemini.extract_structured_symptoms(
        text_or_transcript=payload.raw_transcript,
        language_hint=payload.language_hint
    )

    now = datetime.now(timezone.utc)
    report_id = str(uuid4())

    stage_val = extraction.matched_stage
    if stage_val not in [e.value for e in SymptomStage]:
        stage_val = SymptomStage.COLD_INSOMNIA.value

    structured_data = {
        "detected_language": extraction.detected_language,
        "translated_english_summary": extraction.translated_english_summary,
        "symptoms_mentioned": extraction.symptoms_mentioned,
        "matched_stage": stage_val,
        "confidence": extraction.confidence,
        "needs_human_review": extraction.needs_human_review,
        "gemini_extracted": True
    }

    db_record = {
        "id": report_id,
        "village_name": payload.village_name,
        "subject_name": payload.subject_name or "Anonymous Resident",
        "ward_or_area": payload.ward_or_area,
        "symptom_stage": stage_val,
        "raw_transcript": payload.raw_transcript,
        "structured_symptoms": structured_data,
        "report_channel": ReportChannel.TELEGRAM_VOICE.value,
        "reporter_type": payload.reporter_type.value,
        "reported_at": now.isoformat(),
        "created_at": now.isoformat(),
    }

    if payload.latitude and payload.longitude:
        db_record["location"] = f"POINT({payload.longitude} {payload.latitude})"

    try:
        res = await db.insert("symptom_reports", db_record)
        created = res[0] if res else db_record
    except Exception as e:
        logger.error("Failed to insert voice symptom report: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    return {
        "status": "success",
        "report_id": report_id,
        "village_name": payload.village_name,
        "stage": stage_val,
        "gemini_extraction": extraction.model_dump(),
        "reported_at": now.isoformat()
    }


@router.post("/icon-app", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def submit_icon_report(
    payload: IconReportCreate,
    db: SupabaseClient = Depends(get_db)
):
    """
    Submits structured syndromic tap reports from the icon-based mobile reporting interface.
    """
    now = datetime.now(timezone.utc)
    report_id = str(uuid4())

    structured_data = {
        "selected_symptoms": payload.selected_symptoms,
        "reported_stage": payload.symptom_stage.value,
        "notes": payload.notes,
        "gemini_extracted": False
    }

    db_record = {
        "id": report_id,
        "village_name": payload.village_name,
        "subject_name": payload.subject_name or "Anonymous Resident",
        "ward_or_area": payload.ward_or_area,
        "symptom_stage": payload.symptom_stage.value,
        "raw_transcript": f"Icon report: {', '.join(payload.selected_symptoms)}",
        "structured_symptoms": structured_data,
        "report_channel": ReportChannel.ICON_APP.value,
        "reporter_type": payload.reporter_type.value,
        "reported_at": now.isoformat(),
        "created_at": now.isoformat(),
    }

    if payload.latitude and payload.longitude:
        db_record["location"] = f"POINT({payload.longitude} {payload.latitude})"

    try:
        res = await db.insert("symptom_reports", db_record)
        created = res[0] if res else db_record
    except Exception as e:
        logger.error("Failed to insert icon symptom report: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    return {
        "status": "success",
        "report_id": report_id,
        "village_name": payload.village_name,
        "stage": payload.symptom_stage.value,
        "reported_at": now.isoformat()
    }


@router.get("", response_model=List[Dict[str, Any]])
async def list_reports(
    village_name: Optional[str] = Query(None, description="Filter by village"),
    limit: int = Query(50, ge=1, le=200),
    db: SupabaseClient = Depends(get_db)
):
    """Fetches recent symptom surveillance reports."""
    params = {}
    if village_name:
        params["village_name"] = f"eq.{village_name}"

    try:
        return await db.select("symptom_reports", params=params, limit=limit, order="reported_at.desc")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{report_id}", response_model=Dict[str, Any])
async def delete_report(
    report_id: str = Path(..., description="ID of report to delete"),
    db: SupabaseClient = Depends(get_db)
):
    """Deletes or archives a symptom report."""
    try:
        await db.delete("symptom_reports", filters={"id": f"eq.{report_id}"})
        return {"status": "success", "message": f"Report {report_id} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))