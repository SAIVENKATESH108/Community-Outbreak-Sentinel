"""API Routes for Verbal Autopsy Ingestion and Syndromic Auto-Structuring."""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.core.database import get_db, SupabaseClient
from app.models.verbal_autopsy import VerbalAutopsyCreate
from app.services.gemini_service import GeminiService, get_gemini_service

logger = logging.getLogger("sentinel.verbal_autopsy")

router = APIRouter(prefix="/api/v1/verbal-autopsy", tags=["Verbal Autopsy"])


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def submit_verbal_autopsy(
    payload: VerbalAutopsyCreate,
    db: SupabaseClient = Depends(get_db),
    gemini: GeminiService = Depends(get_gemini_service)
):
    """
    Submits a field verbal autopsy interview.
    Structures symptoms using WHO syndromic guidelines via Gemini AI and auto-links
    to any active cluster or prior symptom reports in the village.
    """
    # 1. Structure verbal autopsy with Gemini
    structured_va = gemini.structure_verbal_autopsy(payload.interview_raw_transcript)

    # 2. Auto-link to matching symptom report if not provided
    linked_report_id = str(payload.linked_symptom_report_id) if payload.linked_symptom_report_id else None
    if not linked_report_id:
        try:
            recent_reports = await db.select(
                "symptom_reports",
                params={
                    "village_name": f"eq.{payload.village_name}"
                },
                limit=10,
                order="reported_at.desc"
            )
            if recent_reports:
                # Prefer confusion, mobility_loss, or deceased, else latest
                candidate = next(
                    (r for r in recent_reports if r.get("symptom_stage") in ["confusion", "mobility_loss", "deceased"]),
                    recent_reports[0]
                )
                linked_report_id = candidate["id"]
                logger.info("Auto-linked verbal autopsy for %s to report %s", payload.deceased_name, linked_report_id)
        except Exception as e:
            logger.warning("Auto-linking query failed: %s", e)

    now = datetime.now(timezone.utc)
    va_id = str(uuid4())

    db_record = {
        "id": va_id,
        "deceased_name": payload.deceased_name,
        "village_name": payload.village_name,
        "interview_raw_transcript": payload.interview_raw_transcript,
        "who_va_structured_data": structured_va.model_dump(),
        "probable_cause_category": structured_va.probable_cause_category,
        "interview_conducted_by": payload.interview_conducted_by.value,
        "date_of_death": payload.date_of_death.isoformat(),
        "civil_registration_prompted": payload.civil_registration_prompted,
        "created_at": now.isoformat(),
    }

    if linked_report_id:
        db_record["linked_symptom_report_id"] = linked_report_id

    if payload.latitude and payload.longitude:
        db_record["location"] = f"POINT({payload.longitude} {payload.latitude})"

    try:
        res = await db.insert("verbal_autopsies", db_record)
        created = res[0] if res else db_record
    except Exception as e:
        logger.error("Failed to insert verbal autopsy: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

    return {
        "status": "success",
        "verbal_autopsy_id": va_id,
        "deceased_name": payload.deceased_name,
        "village_name": payload.village_name,
        "linked_symptom_report_id": linked_report_id,
        "probable_cause_category": structured_va.probable_cause_category,
        "structured_data": structured_va.model_dump()
    }


@router.get("", response_model=List[Dict[str, Any]])
async def list_verbal_autopsies(
    village_name: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: SupabaseClient = Depends(get_db)
):
    """Fetches verbal autopsies records."""
    params = {}
    if village_name:
        params["village_name"] = f"eq.{village_name}"
    try:
        return await db.select("verbal_autopsies", params=params, limit=limit, order="created_at.desc")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
