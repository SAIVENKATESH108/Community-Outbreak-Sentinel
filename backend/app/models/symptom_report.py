"""Pydantic schemas for Symptom Reports."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, ConfigDict, Field


class SymptomStage(str, Enum):
    COLD_INSOMNIA = "cold_insomnia"
    MOBILITY_LOSS = "mobility_loss"
    CONFUSION = "confusion"
    DECEASED = "deceased"


class ReporterType(str, Enum):
    SELF = "self"
    FAMILY_MEMBER = "family_member"
    ASHA_WORKER = "asha_worker"


class ReportChannel(str, Enum):
    TELEGRAM_VOICE = "telegram_voice"
    ICON_APP = "icon_app"


class VoiceReportCreate(BaseModel):
    """Input payload for voice/text transcription reporting."""
    raw_transcript: str = Field(..., description="Raw text or transcription from speech-to-text")
    village_name: str = Field(..., description="Name of the village")
    subject_name: Optional[str] = "Anonymous Resident"
    reporter_type: ReporterType = ReporterType.SELF
    ward_or_area: Optional[str] = None
    language_hint: Optional[str] = None
    audio_recording_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class IconReportCreate(BaseModel):
    """Input payload for mobile icon-based reporting."""
    village_name: str = Field(..., description="Name of the reporting village")
    selected_symptoms: List[str] = Field(..., description="Tapped symptom icons")
    symptom_stage: SymptomStage = Field(..., description="Selected progression stage")
    subject_name: Optional[str] = "Anonymous Resident"
    reporter_type: ReporterType = ReporterType.ASHA_WORKER
    ward_or_area: Optional[str] = None
    notes: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class SymptomReportCreate(BaseModel):
    village_name: str
    subject_name: Optional[str] = "Anonymous Resident"
    ward_or_area: Optional[str] = None
    symptom_stage: SymptomStage
    raw_transcript: Optional[str] = None
    structured_symptoms: Optional[Dict[str, Any]] = None
    report_channel: ReportChannel = ReportChannel.TELEGRAM_VOICE
    reporter_type: ReporterType = ReporterType.SELF
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    reported_at: Optional[datetime] = None


class SymptomReportResponse(BaseModel):
    id: UUID
    village_name: str
    subject_name: Optional[str] = None
    ward_or_area: Optional[str] = None
    symptom_stage: str
    raw_transcript: Optional[str] = None
    structured_symptoms: Optional[Dict[str, Any]] = None
    report_channel: str
    reporter_type: str
    reported_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)