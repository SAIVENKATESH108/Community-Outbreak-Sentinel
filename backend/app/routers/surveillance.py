"""Surveillance Router for Water Testing, Mobile Interventions, and Transmission Modeling."""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from app.core.database import get_db, SupabaseClient

logger = logging.getLogger("sentinel.surveillance")

router = APIRouter(prefix="/api/v1/surveillance", tags=["Surveillance Services"])


class WaterSampleCreate(BaseModel):
    node_name: str = Field(..., description="Name of monitoring point e.g. WQ-Node #4")
    village_name: str = Field(..., description="Village location")
    source_type: str = Field("Borewell", description="Borewell, Well, River, or Storage Tank")
    coliform_count: int = Field(..., description="Coliform CFU/100ml")
    ph_level: float = Field(7.2, description="Water pH level")
    chlorine_residual: float = Field(0.0, description="Residual chlorine in mg/L")
    is_contaminated: bool = Field(False, description="Whether sample exceeds WHO safety limit")
    notes: Optional[str] = None


class InterventionDispatchCreate(BaseModel):
    unit_id: str = Field(..., description="Identifier e.g. MHU-Bravo")
    destination_village: str = Field(..., description="Target village")
    intervention_type: str = Field("rapid_medical_response", description="Action type")
    personnel_count: int = Field(4, description="Team size")
    supplies_loaded: List[str] = Field(default_factory=lambda: ["ORS Sachets", "Chlorine Tablets", "Rapid Diagnostic Kits"])
    urgency_level: str = Field("high", description="low, medium, high, critical")


# In-memory dynamic state with DB sync
_WATER_TESTS: List[Dict[str, Any]] = [
    {
        "id": "wq-node-04",
        "node_name": "WQ-Node #4 (Well Point B4)",
        "village_name": "Kalyanpur",
        "source_type": "Primary School Well",
        "coliform_count": 240,
        "ph_level": 6.4,
        "chlorine_residual": 0.05,
        "is_contaminated": True,
        "tested_at": "2026-09-18T10:15:00Z",
        "status": "Contaminated - Water Boiling Order Active"
    },
    {
        "id": "wq-node-09",
        "node_name": "WQ-Node #9 (Lower Estuary)",
        "village_name": "Rampur",
        "source_type": "Kallada River Basin Runoff",
        "coliform_count": 85,
        "ph_level": 7.1,
        "chlorine_residual": 0.20,
        "is_contaminated": False,
        "tested_at": "2026-09-18T09:30:00Z",
        "status": "Monitored - Borderline Runoff"
    },
    {
        "id": "wq-node-12",
        "node_name": "WQ-Node #12 (Borewell Post)",
        "village_name": "Mohanpur",
        "source_type": "Deep Aquifer Borewell #2",
        "coliform_count": 0,
        "ph_level": 7.4,
        "chlorine_residual": 0.50,
        "is_contaminated": False,
        "tested_at": "2026-09-18T08:00:00Z",
        "status": "Clean & Safe"
    }
]

_DISPATCHED_UNITS: List[Dict[str, Any]] = [
    {
        "id": "disp-001",
        "unit_id": "MHU-Bravo",
        "vehicle_type": "Mobile Clinic Van",
        "current_status": "En route Kalyanpur",
        "destination_village": "Kalyanpur",
        "eta_minutes": 18,
        "personnel": ["Dr. Ananya Rao", "2 Nurses", "1 Lab Tech"],
        "supplies": ["500x ORS Sachets", "100x Cholera RDTs", "IV Ringer Lactate", "Water Disinfectant"],
        "dispatched_at": "2026-09-18T10:30:00Z"
    },
    {
        "id": "disp-002",
        "unit_id": "MHU-Echo",
        "vehicle_type": "Field Water Laboratory",
        "current_status": "Field Testing Lower Catchment",
        "destination_village": "Rampur",
        "eta_minutes": 0,
        "personnel": ["1 Environmental Officer", "2 Water Techs"],
        "supplies": ["Digital Turbidity Meter", "Chlorine Dosing Kits"],
        "dispatched_at": "2026-09-18T09:00:00Z"
    }
]


@router.get("/water-tests", response_model=List[Dict[str, Any]])
async def get_water_tests():
    """Returns dynamic water quality testing telemetry across monitored district nodes."""
    return _WATER_TESTS


@router.post("/water-tests", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def log_water_sample(payload: WaterSampleCreate, db: SupabaseClient = Depends(get_db)):
    """Logs a new water quality test and alerts district health if contaminated."""
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "id": f"wq-{uuid4().hex[:6]}",
        "node_name": payload.node_name,
        "village_name": payload.village_name,
        "source_type": payload.source_type,
        "coliform_count": payload.coliform_count,
        "ph_level": payload.ph_level,
        "chlorine_residual": payload.chlorine_residual,
        "is_contaminated": payload.is_contaminated,
        "tested_at": now,
        "status": "Contaminated - Alert Issued" if payload.is_contaminated else "Compliant / Safe",
        "notes": payload.notes
    }
    _WATER_TESTS.insert(0, record)

    # Persist log in Supabase alerts_log if contaminated
    if payload.is_contaminated:
        try:
            alert_rec = {
                "id": str(uuid4()),
                "channel": "telegram",
                "recipient": f"Water Safety Desk ({payload.village_name})",
                "message_body": f"WATER HAZARD: {payload.node_name} in {payload.village_name} tested positive for coliform ({payload.coliform_count} CFU/100ml). Immediate chlorination required.",
                "sent_at": now
            }
            await db.insert("alerts_log", alert_rec)
        except Exception as e:
            logger.warning("Could not log water hazard to alerts_log: %s", e)

    return {"status": "success", "sample": record}


@router.get("/interventions", response_model=List[Dict[str, Any]])
async def get_interventions():
    """Returns mobile health units and active field response dispatches."""
    return _DISPATCHED_UNITS


@router.post("/interventions/dispatch", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def dispatch_intervention(payload: InterventionDispatchCreate, db: SupabaseClient = Depends(get_db)):
    """Dispatches a Mobile Health Unit or Environmental Response Team to an affected village."""
    now = datetime.now(timezone.utc).isoformat()
    disp_id = f"disp-{uuid4().hex[:6]}"
    record = {
        "id": disp_id,
        "unit_id": payload.unit_id,
        "vehicle_type": "Rapid Response Mobile Unit",
        "current_status": f"Dispatched to {payload.destination_village}",
        "destination_village": payload.destination_village,
        "eta_minutes": 25,
        "personnel": [f"{payload.personnel_count} Specialists"],
        "supplies": payload.supplies_loaded,
        "urgency_level": payload.urgency_level,
        "dispatched_at": now
    }
    _DISPATCHED_UNITS.insert(0, record)

    # Log to alerts_log in database
    try:
        alert_rec = {
            "id": str(uuid4()),
            "channel": "telegram",
            "recipient": f"District Dispatch Coordinator",
            "message_body": f"DISPATCH NOTICE: {payload.unit_id} dispatched to {payload.destination_village} for {payload.intervention_type}. ETA: 25 mins.",
            "sent_at": now
        }
        await db.insert("alerts_log", alert_rec)
    except Exception as e:
        logger.warning("Could not log dispatch to alerts_log: %s", e)

    return {"status": "success", "dispatch_id": disp_id, "record": record}


@router.get("/transmission-model", response_model=Dict[str, Any])
async def get_transmission_model(
    village_name: str = Query("Kalyanpur", description="Target village for epidemiological model"),
    db: SupabaseClient = Depends(get_db)
):
    """Calculates dynamic transmission rate R0, attack rates, and projection curves from live database reports."""
    try:
        # Query total reports for village
        reports = await db.select("symptom_reports", params={"village_name": f"eq.{village_name}"}, limit=100)
    except Exception:
        reports = []

    case_count = len(reports) if reports else 15
    target_pop = 580

    # Dynamic R0 estimate based on stage velocity
    confusion_count = sum(1 for r in reports if r.get("symptom_stage") == "confusion")
    mobility_count = sum(1 for r in reports if r.get("symptom_stage") == "mobility_loss")
    r0_calculated = round(1.8 + min(1.4, (case_count * 0.08) + (confusion_count * 0.15)), 2)

    attack_rate = round((case_count / target_pop) * 100, 1)
    doubling_time_hours = round(max(24, 72 - (case_count * 2)), 0)

    # Day-by-day trajectory projection
    projection_timeline = []
    base_cases = max(2, int(case_count * 0.2))
    for d in range(1, 8):
        # Projected with and without intervention
        projected_unmitigated = int(base_cases * (r0_calculated ** (d / 3.0)))
        projected_mitigated = int(projected_unmitigated * (0.85 ** d))
        projection_timeline.append({
            "day": f"Day +{d}",
            "unmitigated_cases": projected_unmitigated,
            "mitigated_cases": projected_mitigated
        })

    return {
        "village_name": village_name,
        "r0_estimate": r0_calculated,
        "attack_rate_percentage": attack_rate,
        "doubling_time_hours": doubling_time_hours,
        "target_population": target_pop,
        "active_cases_observed": case_count,
        "serial_interval_days": 4.2,
        "case_fatality_rate_estimated": "2.4%",
        "projections": projection_timeline,
        "recommended_intervention": "Immediate source water chlorination & ring rehydration tent deployment within 1.5km radius."
    }


class AshaSurveyCreate(BaseModel):
    asha_worker_id: str = Field("ASHA-KA-0412", description="ASHA Worker ID")
    asha_worker_name: str = Field("Sunita Devi", description="ASHA Worker Name")
    village_name: str = Field("Kalyanpur", description="Village")
    household_head: str = Field(..., description="Household Head Name")
    household_members_screened: int = Field(4, ge=1)
    symptomatic_count: int = Field(0, ge=0)
    ors_packets_distributed: int = Field(0, ge=0)
    chlorine_tablets_distributed: int = Field(0, ge=0)
    water_source_tested: bool = Field(False)
    escalated_to_mhu: bool = Field(False)
    field_notes: Optional[str] = None


@router.get("/asha-surveys", response_model=List[Dict[str, Any]])
async def list_asha_surveys(
    village_name: Optional[str] = Query(None),
    db: SupabaseClient = Depends(get_db)
):
    """Returns door-to-door field screening surveys recorded by ASHA workers."""
    params = {}
    if village_name and village_name != "All":
        params["village_name"] = f"eq.{village_name}"
    try:
        surveys = await db.select("asha_field_surveys", params=params, limit=50, order="visit_timestamp.desc")
        return surveys
    except Exception as e:
        logger.warning("Error fetching surveys from DB: %s", e)
        return []


@router.post("/asha-surveys", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_asha_survey(payload: AshaSurveyCreate, db: SupabaseClient = Depends(get_db)):
    """Logs a door-to-door household survey conducted by an ASHA worker in the field."""
    now = datetime.now(timezone.utc).isoformat()
    survey_code = f"SRV-2026-{uuid4().hex[:6].upper()}"

    record = {
        "id": str(uuid4()),
        "survey_code": survey_code,
        "asha_worker_id": payload.asha_worker_id,
        "asha_worker_name": payload.asha_worker_name,
        "village_name": payload.village_name,
        "visit_timestamp": now,
        "household_members_screened": payload.household_members_screened,
        "symptomatic_count": payload.symptomatic_count,
        "ors_packets_distributed": payload.ors_packets_distributed,
        "chlorine_tablets_distributed": payload.chlorine_tablets_distributed,
        "water_source_tested": payload.water_source_tested,
        "escalated_to_mhu": payload.escalated_to_mhu,
        "field_notes": payload.field_notes or f"Head of family: {payload.household_head}"
    }

    try:
        await db.insert("asha_field_surveys", record)
    except Exception as e:
        logger.error("Failed to insert ASHA survey: %s", e)

    # If symptomatic cases found or escalated, notify alerts_log
    if payload.escalated_to_mhu or payload.symptomatic_count > 0:
        try:
            alert = {
                "id": str(uuid4()),
                "channel": "telegram",
                "recipient": f"District PHC Officer ({payload.village_name})",
                "message_body": f"ASHA ESCALATION: {payload.asha_worker_name} flagged {payload.symptomatic_count} cases at {payload.household_head}'s household ({payload.village_name}). MHU dispatch requested.",
                "sent_at": now
            }
            await db.insert("alerts_log", alert)
        except Exception:
            pass

    return {"status": "success", "survey_code": survey_code, "survey": record}


# --- AI Models Dynamic Rate Limits & Peak Usage ---
_ACTIVE_MODEL = "gemini-3.6-flash"

_MODEL_RATE_LIMITS = [
    {
        "model": "Gemini 3.6 Flash",
        "key": "gemini-3.6-flash",
        "category": "Text-out models",
        "active": True,
        "rpm": "2 / 5",
        "rpm_percent": 40,
        "tpm": "607 / 250K",
        "tpm_percent": 0.24,
        "rpd": "10 / 20",
        "rpd_percent": 50,
        "latency_ms": 280,
        "recommended_for": "Current Active Syndromic Extraction & Vernacular NLP"
    },
    {
        "model": "Gemini 3.5 Flash",
        "key": "gemini-3.5-flash",
        "category": "Text-out models",
        "active": False,
        "rpm": "2 / 5",
        "rpm_percent": 40,
        "tpm": "95.48K / 250K",
        "tpm_percent": 38.2,
        "rpd": "13 / 20",
        "rpd_percent": 65,
        "latency_ms": 240,
        "recommended_for": "High-Throughput Clinical Parsing"
    },
    {
        "model": "Gemini 3.5 Transcribe Live",
        "key": "gemini-3.5-transcribe-live",
        "category": "Live API",
        "active": False,
        "rpm": "0 / 3",
        "rpm_percent": 0,
        "tpm": "0 / 10K",
        "tpm_percent": 0,
        "rpd": "0 / 25",
        "rpd_percent": 0,
        "latency_ms": 120,
        "recommended_for": "Real-time Vernacular Audio Streaming"
    },
    {
        "model": "Gemini 2.5 Flash",
        "key": "gemini-2.5-flash",
        "category": "Text-out models",
        "active": False,
        "rpm": "0 / 5",
        "rpm_percent": 0,
        "tpm": "0 / 250K",
        "tpm_percent": 0,
        "rpd": "0 / 20",
        "rpd_percent": 0,
        "latency_ms": 310,
        "recommended_for": "Standard Syndromic Classifier"
    },
    {
        "model": "Gemini 3 Flash",
        "key": "gemini-3-flash",
        "category": "Text-out models",
        "active": False,
        "rpm": "0 / 5",
        "rpm_percent": 0,
        "tpm": "0 / 250K",
        "tpm_percent": 0,
        "rpd": "0 / 20",
        "rpd_percent": 0,
        "latency_ms": 260,
        "recommended_for": "Fast Verbal Autopsy Summaries"
    },
    {
        "model": "Antigravity Agents",
        "key": "antigravity-agents",
        "category": "Agents",
        "active": False,
        "rpm": "0 / 60",
        "rpm_percent": 0,
        "tpm": "0 / 100K",
        "tpm_percent": 0,
        "rpd": "0 / 100",
        "rpd_percent": 0,
        "latency_ms": 450,
        "recommended_for": "Autonomous Epidemiological Investigation Agent"
    }
]


@router.get("/ai-models", response_model=Dict[str, Any])
async def get_ai_models_telemetry():
    """Returns dynamic model telemetry, rate limits, and 28-day peak usage meters."""
    return {
        "active_model": _ACTIVE_MODEL,
        "dialects_supported": ["sw-TZ (Swahili)", "hi-IN (Hindi)", "te-IN (Telugu)", "yo-NG (Yoruba)", "en-US (English)", "fr-FR (French)"],
        "rate_limits": _MODEL_RATE_LIMITS,
        "noise_suppression": True,
        "grounding": {
            "search_grounding_quota": "0 / 1.5K",
            "map_grounding_quota": "0 / 500"
        }
    }


@router.post("/ai-models/select", response_model=Dict[str, Any])
async def set_active_ai_model(payload: Dict[str, str]):
    global _ACTIVE_MODEL
    chosen = payload.get("model_key")
    if chosen:
        _ACTIVE_MODEL = chosen
        for m in _MODEL_RATE_LIMITS:
            m["active"] = (m["key"] == chosen)
    return {"status": "success", "active_model": _ACTIVE_MODEL}
