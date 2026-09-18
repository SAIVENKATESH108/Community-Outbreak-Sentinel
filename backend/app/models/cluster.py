"""Pydantic schemas for Outbreak Clusters."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ClusterStatus(str, Enum):
    DETECTED = "detected"
    CONFIRMED = "confirmed"
    DISMISSED = "dismissed"


class ClusterResponse(BaseModel):
    id: UUID
    village_name: str
    case_count: int
    matched_symptom_reports: List[UUID]
    detection_window_start: datetime
    detection_window_end: datetime
    severity_score: float
    status: str
    alert_sent_at: Optional[datetime] = None
    created_at: datetime
    center_location: Optional[str] = None

    # Enriched diagnostic fields for UI display
    stages_breakdown: Optional[Dict[str, int]] = None
    has_linked_verbal_autopsy: Optional[bool] = False
    linked_deaths_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


class ClusterDetectionResult(BaseModel):
    clusters_detected: int
    active_clusters: List[ClusterResponse]
    sweep_timestamp: datetime
    details: str


class ClusterActionResponse(BaseModel):
    id: UUID
    status: str
    updated_at: datetime
    message: str