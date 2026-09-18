"""Pydantic schemas for Verbal Autopsies."""

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class InterviewConductedBy(str, Enum):
    ASHA_WORKER = "asha_worker"
    ANM = "anm"
    MEDICAL_OFFICER = "medical_officer"
    FIELD_EPIDEMIOLOGIST = "field_epidemiologist"


class VerbalAutopsyCreate(BaseModel):
    deceased_name: str = Field(..., description="Full name of the deceased individual")
    village_name: str = Field(..., description="Village where the death occurred")
    interview_raw_transcript: str = Field(..., description="Field interview transcript with family/caregiver")
    date_of_death: date = Field(..., description="Date when death occurred (YYYY-MM-DD)")
    interview_conducted_by: InterviewConductedBy = InterviewConductedBy.ASHA_WORKER
    linked_symptom_report_id: Optional[UUID] = None
    civil_registration_prompted: bool = True
    audio_recording_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class VerbalAutopsyResponse(BaseModel):
    id: UUID
    linked_symptom_report_id: Optional[UUID] = None
    deceased_name: str
    village_name: str
    interview_raw_transcript: str
    who_va_structured_data: Optional[Dict[str, Any]] = None
    probable_cause_category: Optional[str] = None
    interview_conducted_by: str
    date_of_death: date
    civil_registration_prompted: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)