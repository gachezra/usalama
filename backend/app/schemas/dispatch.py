"""
USALAMA Citizen Dispatch Schemas
Pydantic models for the verification dispatch loop.
"""
import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.enums import DispatchStatus, FeedbackVerdict


# --- Citizen ---

class CitizenCreate(BaseModel):
    """Register a new citizen verifier."""
    phone: str = Field(..., min_length=10, max_length=20, description="Kenya phone number")
    name: str = Field(..., min_length=2, max_length=255)
    county: str = Field(..., min_length=2, max_length=100)


class CitizenResponse(BaseModel):
    id: uuid.UUID
    phone: str
    name: str
    county: str
    reputation_score: int
    total_verifications: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    id: uuid.UUID
    name: str
    county: str
    reputation_score: int
    total_verifications: int


# --- Dispatch (VerificationRequest) ---

class DispatchCreate(BaseModel):
    """Create dispatch tasks from audit ClarificationRequests."""
    gps_target_lat: Optional[float] = Field(None, description="Project site latitude")
    gps_target_lng: Optional[float] = Field(None, description="Project site longitude")
    radius_meters: int = Field(500, ge=50, le=5000, description="GPS tolerance in meters")
    deadline: Optional[datetime] = Field(None, description="Task expiry time")


class DispatchResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    audit_log_id: uuid.UUID
    citizen_id: Optional[uuid.UUID]
    question: str
    context: str
    data_point_needed: str
    priority: str
    gps_target_lat: Optional[float]
    gps_target_lng: Optional[float]
    radius_meters: int
    status: DispatchStatus
    assigned_at: Optional[datetime]
    deadline: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class DispatchBatchResponse(BaseModel):
    """Response after creating dispatch tasks from an audit."""
    dispatched: int
    tasks: List[DispatchResponse]


# --- Verification Submission ---

class VerificationSubmit(BaseModel):
    """Citizen submitting photo verification for a dispatch task."""
    gps_lat: float = Field(..., description="Citizen's GPS latitude at time of photo")
    gps_lng: float = Field(..., description="Citizen's GPS longitude at time of photo")
    photo_url: str = Field(..., min_length=5, max_length=500, description="URL/path to uploaded photo")
    photo_hash: Optional[str] = Field(None, max_length=64, description="SHA-256 hash of photo file")


class VerificationResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    citizen_id: Optional[uuid.UUID]
    request_id: Optional[uuid.UUID]
    gps_lat: float
    gps_lng: float
    photo_url: str
    photo_hash: Optional[str]
    is_off_site: bool
    status: str
    submitted_at: datetime

    model_config = {"from_attributes": True}


# --- Feedback ---

class FeedbackCreate(BaseModel):
    """Admin reviewing a citizen's verification submission."""
    reviewed_by: str = Field(..., min_length=2, max_length=255)
    verdict: FeedbackVerdict
    comment: Optional[str] = None
    reputation_delta: int = Field(0, ge=-5, le=5, description="Reputation change for citizen")


class FeedbackResponse(BaseModel):
    id: uuid.UUID
    verification_id: uuid.UUID
    reviewed_by: str
    verdict: FeedbackVerdict
    comment: Optional[str]
    reputation_delta: int
    created_at: datetime

    model_config = {"from_attributes": True}
