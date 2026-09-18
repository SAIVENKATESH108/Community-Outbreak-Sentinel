"""Pydantic schemas for Gemini AI structured extraction outputs."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SymptomExtractionResponse(BaseModel):
    """Schema for multilingual syndromic symptom extraction."""

    detected_language: str = Field(
        ...,
        description="ISO language code of the input (e.g., 'hi', 'te', 'en', 'mr')"
    )
    translated_english_summary: str = Field(
        ...,
        description="Concise English clinical summary of reported complaints"
    )
    symptoms_mentioned: List[str] = Field(
        default_factory=list,
        description="Standardized symptom tokens (e.g. fever, chills, insomnia, weakness, confusion)"
    )
    matched_stage: str = Field(
        ...,
        description="Syndromic progression stage: 'cold_insomnia', 'mobility_loss', 'confusion', or 'other'"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence score between 0.0 and 1.0"
    )
    needs_human_review: bool = Field(
        default=False,
        description="Flag set to true if symptoms are ambiguous or indicate acute critical emergency"
    )


class SymptomProgressionStep(BaseModel):
    day: Optional[int] = None
    stage: str
    description: str


class VerbalAutopsyExtractionResponse(BaseModel):
    """Schema for WHO-compatible verbal autopsy interview structuring."""

    symptoms_before_death: List[str] = Field(
        default_factory=list,
        description="List of terminal symptoms described by the respondent"
    )
    progression_sequence: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Chronological milestones before death (day/stage/description)"
    )
    probable_cause_category: str = Field(
        ...,
        description="Syndromic disease category (e.g., 'Acute Encephalitic Syndrome (Probable Arboviral etiology)')"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Assessment confidence score"
    )
    disclaimer_note: str = Field(
        default="This is an automated syndromic surveillance aid for epidemiological triage only and does not constitute a clinical diagnosis or medical death certification.",
        description="Mandatory non-diagnostic legal disclaimer"
    )