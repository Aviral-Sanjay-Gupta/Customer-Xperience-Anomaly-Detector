"""Pydantic schema models for CX Anomaly Detection."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class InteractionRecord(BaseModel):
    """Schema for a single CX interaction record."""

    interaction_id: str = Field(..., description="Unique interaction identifier")
    timestamp: datetime = Field(..., description="Interaction timestamp")
    csat: Optional[float] = Field(None, ge=1.0, le=5.0, description="Customer satisfaction score")
    ies: Optional[float] = Field(None, ge=0.0, le=100.0, description="Internal efficiency score")
    complaints: Optional[int] = Field(None, ge=0, description="Number of complaints")
    aht_seconds: Optional[float] = Field(None, ge=0, description="Average handle time in seconds")
    hold_time_seconds: Optional[float] = Field(
        None, ge=0, description="Hold time in seconds"
    )
    transfers: Optional[int] = Field(None, ge=0, description="Number of transfers")
    channel: Optional[str] = Field(None, description="Communication channel")
    language: Optional[str] = Field(None, description="Language code")
    queue: Optional[str] = Field(None, description="Queue name")

    @field_validator("timestamp", mode="before")
    @classmethod
    def parse_timestamp(cls, v):
        """Parse timestamp from various formats."""
        if isinstance(v, str):
            # Try ISO format first
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00"))
            except ValueError:
                # Try common formats
                for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"]:
                    try:
                        return datetime.strptime(v, fmt)
                    except ValueError:
                        continue
                raise ValueError(f"Unable to parse timestamp: {v}")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "interaction_id": "abc-123",
                "timestamp": "2025-10-15T10:00:00Z",
                "csat": 3.2,
                "ies": 64.0,
                "complaints": 1,
                "aht_seconds": 420.0,
                "hold_time_seconds": 60.0,
                "transfers": 0,
                "channel": "voice",
                "language": "en",
                "queue": "billing",
            }
        }


class AnomalyScore(BaseModel):
    """Response schema for anomaly scoring with selective model support."""

    interaction_id: str
    scores: dict[str, float] = Field(..., description="Model scores (higher = more anomalous)")
    is_anomaly: dict[str, int] = Field(..., description="Anomaly flags per model (1=anomaly, 0=normal)")

    class Config:
        json_schema_extra = {
            "example": {
                "interaction_id": "abc-123",
                "scores": {"iforest": 0.85, "rcf": 0.78},
                "is_anomaly": {"iforest": 1, "rcf": 0, "ensemble": 1},
            }
        }


class BatchScoreRequest(BaseModel):
    """Request schema for batch scoring."""

    records: list[InteractionRecord]


class BatchScoreResponse(BaseModel):
    """Response schema for batch scoring."""

    scores: list[AnomalyScore]
    total_records: int
    anomalies_detected: int
    processing_time_ms: float


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    timestamp: datetime
    model_loaded: bool
    version: str
