"""Pydantic schemas for Alerts and Notifications."""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class AlertChannel(str, Enum):
    TELEGRAM = "telegram"
    EMAIL = "email"


class AlertLogCreate(BaseModel):
    cluster_id: UUID
    channel: AlertChannel
    recipient: str
    message_summary: str
    delivery_status: str = "sent"


class AlertLogResponse(BaseModel):
    id: UUID
    cluster_id: UUID
    channel: str
    recipient: str
    message_summary: str
    sent_at: datetime
    delivery_status: str

    model_config = ConfigDict(from_attributes=True)