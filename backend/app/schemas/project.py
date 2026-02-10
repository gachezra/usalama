"""
USALAMA Project API Schemas
Pydantic models for project CRUD operations.
"""
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, Field

from app.models.enums import ProjectStatus, RiskLevel


class ProjectCreate(BaseModel):
    """Schema for creating a new project."""
    title: str = Field(..., min_length=5, max_length=255)
    description: Optional[str] = None
    county: str = Field(..., min_length=2, max_length=100)
    constituency: str = Field(..., min_length=2, max_length=100)
    contractor_name: str = Field(..., min_length=2, max_length=255)
    total_budget: Decimal = Field(..., gt=0, description="Budget in KES")
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectResponse(BaseModel):
    """Schema for project response."""
    id: uuid.UUID
    title: str
    description: Optional[str]
    county: str
    constituency: str
    contractor_name: str
    total_budget: Decimal
    status: ProjectStatus
    risk_score: int
    risk_level: RiskLevel
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime
    document_count: int = 0

    model_config = {"from_attributes": True}


class ProjectDetail(ProjectResponse):
    """Extended project response with documents."""
    documents: List["DocumentResponse"] = []
    latest_verdict: Optional[dict] = None


class DocumentResponse(BaseModel):
    """Schema for document response."""
    id: uuid.UUID
    file_url: str
    file_hash: str
    doc_type: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    """Response after file upload."""
    document_id: uuid.UUID
    file_hash: str
    doc_type: str
    extracted_chars: int
    message: str


# Update forward reference
ProjectDetail.model_rebuild()
