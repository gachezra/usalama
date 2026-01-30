"""
USALAMA Intelligence Engine Schemas
Defines the forensic audit data structures for the "Tribunal" system.
"""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class DocumentType(str, Enum):
    """Classification of tender documents."""
    BOQ = "bill_of_quantities"
    SPECS = "technical_specifications"
    CONTRACT = "legal_contract"
    INVOICE = "payment_invoice"
    DELIVERY_NOTE = "delivery_note"
    PHOTO_EVIDENCE = "photo_evidence"
    OTHER = "other"


class Severity(str, Enum):
    """Corruption flag severity levels."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CorruptionFlag(BaseModel):
    """
    A detected anomaly or potential corruption indicator.
    Each flag represents a specific rule violation with evidence.
    """
    rule_broken: str = Field(
        ...,
        description="The specific procurement rule or logic that failed",
        examples=["Material grade mismatch between BoQ and Specifications"]
    )
    severity: Severity = Field(
        ...,
        description="Impact level: LOW (clerical), MEDIUM (suspicious), HIGH (likely fraud), CRITICAL (confirmed fraud pattern)"
    )
    evidence: str = Field(
        ...,
        description="Direct quote from document(s) proving the flag",
        min_length=10
    )
    legal_implication: Optional[str] = Field(
        None,
        description="Reference to Public Procurement Act section if applicable",
        examples=["Section 68(1) - False documentation"]
    )
    document_sources: List[str] = Field(
        default_factory=list,
        description="Which documents this flag references"
    )

    @field_validator('evidence')
    @classmethod
    def evidence_not_generic(cls, v: str) -> str:
        """Ensure evidence is specific, not generic."""
        generic_phrases = ['suspicious', 'seems wrong', 'might be']
        if any(phrase in v.lower() for phrase in generic_phrases):
            raise ValueError('Evidence must be specific, not generic opinions')
        return v


class ClarificationRequest(BaseModel):
    """
    A request for additional information from citizen verifiers.
    Generated when the AI identifies data gaps that prevent conclusive analysis.
    """
    question: str = Field(
        ...,
        description="A direct COMMAND to the citizen. MUST start with 'Take a photo of...', 'Photograph the...', or 'Record video of...'. Never ask written questions.",
        examples=["Take a photo of the cement bag label showing the brand name", "Photograph the road surface showing the material type"]
    )
    context: str = Field(
        ...,
        description="Why this evidence is needed (e.g., 'To verify the cement brand matches the BoQ specification')"
    )
    data_point_needed: str = Field(
        ...,
        description="The specific object to capture (e.g., 'Cement Bag Label', 'Road Surface Material')",
        examples=["Cement Bag Label", "Road Surface", "Delivery Receipt Date"]
    )
    priority: Severity = Field(
        default=Severity.MEDIUM,
        description="How urgently this evidence is needed"
    )


class ForensicVerdict(BaseModel):
    """
    The complete AI audit verdict for a tender package.
    This is the primary output of the ForensicBrain.
    """
    project_title: str = Field(..., description="Name of the project audited")
    contractor_name: Optional[str] = Field(None, description="Contractor under review")
    contractor_risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="AI-computed risk score: 0 (clean) to 100 (confirmed corruption)"
    )
    flags: List[CorruptionFlag] = Field(
        default_factory=list,
        description="List of detected anomalies"
    )
    clarifications_needed: List[ClarificationRequest] = Field(
        default_factory=list,
        description="Information gaps requiring citizen verification"
    )
    is_compliant: bool = Field(
        ...,
        description="Overall compliance verdict"
    )
    executive_summary: str = Field(
        ...,
        description="Human-readable summary for officials",
        min_length=50
    )
    documents_analyzed: List[str] = Field(
        default_factory=list,
        description="List of document types that were analyzed"
    )
    analysis_confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="AI confidence in the verdict (0.0-1.0)"
    )


class TenderDocument(BaseModel):
    """Input document for analysis."""
    content: str = Field(..., description="The document text content")
    doc_type: Optional[DocumentType] = Field(
        None,
        description="Pre-classified document type (optional)"
    )
    filename: Optional[str] = Field(None, description="Original filename")


class AuditRequest(BaseModel):
    """Request payload for tender audit endpoint."""
    project_title: str = Field(..., description="Name of the project")
    contractor_name: Optional[str] = Field(None)
    documents: List[TenderDocument] = Field(
        ...,
        min_length=1,
        description="Documents to analyze (minimum 1)"
    )
