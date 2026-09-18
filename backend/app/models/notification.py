"""Pydantic schemas for Outbreak Proximity Notifications."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ProximityNotificationBase(BaseModel):
    cluster_id: Optional[UUID] = None
    village_name: str
    district: str
    recipient_identifier: str
    channel: str = "in_app"  # 'telegram', 'in_app', 'email'
    severity_level: str = "high"
    alert_message: str


class ProximityNotificationResponse(ProximityNotificationBase):
    id: UUID
    recipient_user_id: Optional[UUID] = None
    sent_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)
