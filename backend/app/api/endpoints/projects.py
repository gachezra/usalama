"""
USALAMA Project API Endpoints
The Bridge between Frontend and ForensicBrain.
"""
import logging
import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from sqlalchemy import desc

from app.db.base import get_db
from app.models.project import Project
from app.models.document import Document
from app.models.audit_log import AuditLog
from app.models.enums import ProjectStatus, RiskLevel
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectDetail,
    DocumentResponse,
    UploadResponse,
)
from app.schemas.intelligence import (
    ForensicVerdict,
    TenderDocument,
    DocumentType,
    CorruptionFlag,
    ClarificationRequest,
    Severity,
)
from app.services.brain import get_forensic_brain
from app.services.parser import extract_and_hash

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["projects"])

# Upload storage directory (relative to backend root)
UPLOAD_DIR = "uploads"


def _ensure_upload_dir():
    """Ensure upload directory exists."""
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new project for oversight.

    This registers a government project in the USALAMA system,
    ready for document uploads and forensic analysis.
    """
    project = Project(
        title=project_data.title,
        description=project_data.description,
        county=project_data.county,
        constituency=project_data.constituency,
        contractor_name=project_data.contractor_name,
        total_budget=project_data.total_budget,
        start_date=project_data.start_date,
        end_date=project_data.end_date,
        status=ProjectStatus.PLANNED,
        risk_level=RiskLevel.LOW,
        risk_score=0,
    )

    db.add(project)
    await db.commit()
    await db.refresh(project)

    logger.info(f"Project created: {project.id} - {project.title}")

    return ProjectResponse(
        id=project.id,
        title=project.title,
        description=project.description,
        county=project.county,
        constituency=project.constituency,
        contractor_name=project.contractor_name,
        total_budget=project.total_budget,
        status=project.status,
        risk_score=project.risk_score,
        risk_level=project.risk_level,
        start_date=project.start_date,
        end_date=project.end_date,
        created_at=project.created_at,
        document_count=0,
    )


@router.get("/{project_id}", response_model=ProjectDetail)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get project details with documents and risk score.
    """
    try:
        result = await db.execute(
            select(Project)
            .options(selectinload(Project.documents))
            .where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found",
            )

        # Fetch latest audit log for this project
        audit_result = await db.execute(
            select(AuditLog)
            .where(AuditLog.project_id == project_id)
            .order_by(desc(AuditLog.analyzed_at))
            .limit(1)
        )
        latest_audit = audit_result.scalar_one_or_none()

        # Defensive access: ai_analysis could fail serialization
        latest_verdict = None
        if latest_audit:
            try:
                latest_verdict = latest_audit.ai_analysis
            except Exception as e:
                logger.error(
                    f"Anomaly Detected: Failed to serialize ai_analysis for project {project_id}: {e}"
                )

        docs = project.documents or []

        return ProjectDetail(
            id=project.id,
            title=project.title,
            description=project.description,
            county=project.county,
            constituency=project.constituency,
            contractor_name=project.contractor_name,
            total_budget=project.total_budget,
            status=project.status,
            risk_score=project.risk_score,
            risk_level=project.risk_level,
            start_date=project.start_date,
            end_date=project.end_date,
            created_at=project.created_at,
            document_count=len(docs),
            documents=[
                DocumentResponse(
                    id=doc.id,
                    file_url=doc.file_url,
                    file_hash=doc.file_hash,
                    doc_type=doc.doc_type,
                    uploaded_at=doc.uploaded_at,
                )
                for doc in docs
            ],
            latest_verdict=latest_verdict,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Anomaly Detected: Unhandled error fetching project {project_id}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error retrieving project. Check forensic logs.",
        )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 50,
    county: str = None,
    status_filter: ProjectStatus = None,
    db: AsyncSession = Depends(get_db),
):
    """
    List all projects with optional filtering.
    """
    try:
        query = select(Project)

        if county:
            query = query.where(Project.county == county)
        if status_filter:
            query = query.where(Project.status == status_filter)

        query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)

        result = await db.execute(query)
        projects = result.scalars().all()

        # Get document counts
        response = []
        for project in projects:
            count_result = await db.execute(
                select(func.count(Document.id)).where(Document.project_id == project.id)
            )
            doc_count = count_result.scalar() or 0

            response.append(
                ProjectResponse(
                    id=project.id,
                    title=project.title,
                    description=project.description,
                    county=project.county,
                    constituency=project.constituency,
                    contractor_name=project.contractor_name,
                    total_budget=project.total_budget,
                    status=project.status,
                    risk_score=project.risk_score,
                    risk_level=project.risk_level,
                    start_date=project.start_date,
                    end_date=project.end_date,
                    created_at=project.created_at,
                    document_count=doc_count,
                )
            )

        return response
    except Exception as e:
        logger.error(
            f"Anomaly Detected: Failed to list projects: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error listing projects. Check forensic logs.",
        )


@router.post("/{project_id}/upload", response_model=UploadResponse)
async def upload_document(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a PDF document for a project.

    The document is:
    1. Parsed to extract text and tables
    2. Hashed with SHA-256 for blockchain verification
    3. Classified by the ForensicBrain
    4. Stored with the project
    """
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )

    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )

    # Read file content
    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded",
        )

    # Extract text and compute hash
    try:
        extracted_text, file_hash = extract_and_hash(file_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    # Check for duplicate (same hash)
    existing = await db.execute(
        select(Document).where(
            Document.project_id == project_id,
            Document.file_hash == file_hash,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Document with hash {file_hash[:16]}... already exists for this project",
        )

    # Classify document — filename heuristic first, LLM fallback for vague names
    filename_lower = file.filename.lower()
    if "boq" in filename_lower or "quantities" in filename_lower or "bill" in filename_lower:
        doc_type_val = DocumentType.BOQ.value
    elif "spec" in filename_lower:
        doc_type_val = DocumentType.SPECS.value
    else:
        # Fallback to AI if filename is vague
        brain = get_forensic_brain()
        doc_type_enum = await brain.classify_document(extracted_text)
        doc_type_val = doc_type_enum.value if hasattr(doc_type_enum, 'value') else doc_type_enum

    # Save file to disk
    _ensure_upload_dir()
    file_path = os.path.join(UPLOAD_DIR, f"{file_hash[:16]}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Store document record
    document = Document(
        project_id=project_id,
        file_url=file_path,
        file_hash=file_hash,
        doc_type=doc_type_val,
    )

    db.add(document)
    await db.commit()
    await db.refresh(document)

    logger.info(
        f"Document uploaded: {document.id} - {doc_type_val} for project {project_id}"
    )

    return UploadResponse(
        document_id=document.id,
        file_hash=file_hash,
        doc_type=doc_type_val,
        extracted_chars=len(extracted_text),
        message=f"Document classified as {doc_type_val}",
    )


@router.post("/{project_id}/audit", response_model=ForensicVerdict)
async def audit_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger forensic audit on all uploaded documents.

    The ForensicBrain will:
    1. Cross-reference BoQ against Specifications
    2. Detect price anomalies
    3. Identify data gaps requiring citizen verification
    4. Return a ForensicVerdict with risk score and flags
    """
    # Fetch project with documents
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.documents))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )

    # --- DEMO BYPASS: instant hardcoded verdict for demo projects ---
    if "DEMO" in (project.title or "").upper():
        logger.info(f"DEMO bypass triggered for project {project_id}")

        verdict = ForensicVerdict(
            project_title=project.title,
            contractor_risk_score=95,
            is_compliant=False,
            flags=[
                CorruptionFlag(
                    rule_broken="Prohibited Material Usage: MC-30 Cutback Bitumen specified instead of Asphalt Concrete Type I as required by KeNHA standards",
                    severity="CRITICAL",
                    evidence="Technical specifications document references 'MC-30 Cutback Bitumen' for surface dressing. "
                             "KeNHA Standard Specification Section 16.3 mandates 'Asphalt Concrete Type I (AC 14)' for roads "
                             "with AADT > 500. MC-30 is a low-grade cutback prohibited for trunk roads since 2018. "
                             "[SOURCE: technical_specifications.pdf]",
                    legal_implication="Section 68(1) Public Procurement and Asset Disposal Act - Use of substandard materials",
                    document_sources=["technical_specifications.pdf"],
                ),
                CorruptionFlag(
                    rule_broken="Scope Downgrade: Bill of Quantities describes gravel base course where specifications require hot-mix asphalt overlay",
                    severity="HIGH",
                    evidence="BoQ Line 4.2 lists 'Natural Gravel Base (150mm)' at KES 3,200/sqm. "
                             "Original tender scope required 'Hot-Mix Asphalt Overlay (60mm)' at KES 8,500/sqm. "
                             "Cost differential of KES 5,300/sqm across 12km stretch = KES 47.7M unexplained. "
                             "[SOURCE: bill_of_quantities.pdf]",
                    legal_implication="Section 62(1) - Material deviation from contract scope without variation order",
                    document_sources=["bill_of_quantities.pdf"],
                ),
                CorruptionFlag(
                    rule_broken="Missing Financial Data: Multiple line items marked 'TBD' in Bill of Quantities",
                    severity="LOW",
                    evidence="BoQ contains 6 line items with unit rates listed as 'TBD' or 'Provisional'. "
                             "Total provisional sum = KES 12.3M (26% of contract value). "
                             "No supporting quotations or market rate justifications attached.",
                    legal_implication="Section 45(2) - Incomplete procurement records",
                    document_sources=["bill_of_quantities.pdf"],
                ),
            ],
            clarifications_needed=[
                ClarificationRequest(
                    question="Photograph the bitumen drum labels at the contractor's site storage yard to confirm product grade",
                    context="To verify whether MC-30 Cutback Bitumen or Asphalt Concrete binder is being used on-site",
                    data_point_needed="Bitumen Product Grade Label",
                    priority=Severity.CRITICAL,
                ),
            ],
            executive_summary=(
                "CRITICAL RISK: Forensic analysis detected use of MC-30 Cutback Bitumen — a low-grade material "
                "prohibited for trunk roads under KeNHA standards since 2018. The contractor's technical specifications "
                "reference MC-30 instead of the mandated Asphalt Concrete Type I. Additionally, the Bill of Quantities "
                "shows a scope downgrade from asphalt to gravel with a KES 47.7M cost gap unaccounted for. "
                "Citizen verification of on-site material labels is urgently required."
            ),
            documents_analyzed=["technical_specifications.pdf", "bill_of_quantities.pdf"],
            analysis_confidence=0.99,
        )

        # Persist audit log
        audit_log = AuditLog(
            project_id=project_id,
            ai_analysis=verdict.model_dump(),
            flagged_anomalies=[f.rule_broken for f in verdict.flags],
        )
        db.add(audit_log)

        # Update project risk
        project.risk_score = verdict.contractor_risk_score
        project.risk_level = RiskLevel.CRITICAL
        project.status = ProjectStatus.FLAGGED

        await db.commit()

        logger.info(
            f"DEMO audit complete for project {project_id}: "
            f"risk_score={verdict.contractor_risk_score}, flags={len(verdict.flags)}"
        )
        return verdict
    # --- END DEMO BYPASS ---

    if len(project.documents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents uploaded for this project. Upload documents before auditing.",
        )

    # Load document contents
    tender_documents = []
    for doc in project.documents:
        try:
            with open(doc.file_url, "rb") as f:
                file_bytes = f.read()
            text, _ = extract_and_hash(file_bytes)

            tender_documents.append(
                TenderDocument(
                    content=text,
                    doc_type=DocumentType(doc.doc_type) if doc.doc_type in [dt.value for dt in DocumentType] else None,
                    filename=os.path.basename(doc.file_url),
                )
            )
        except Exception as e:
            logger.error(f"Failed to read document {doc.id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read document: {doc.file_hash[:16]}...",
            )

    # Run forensic audit
    brain = get_forensic_brain()
    verdict = await brain.audit_tender_package(
        documents=tender_documents,
        project_title=project.title,
        contractor_name=project.contractor_name,
    )

    # Update project risk score
    project.risk_score = verdict.contractor_risk_score

    # Determine risk level from score
    if verdict.contractor_risk_score >= 75:
        project.risk_level = RiskLevel.CRITICAL
        project.status = ProjectStatus.FLAGGED
    elif verdict.contractor_risk_score >= 50:
        project.risk_level = RiskLevel.HIGH
    elif verdict.contractor_risk_score >= 25:
        project.risk_level = RiskLevel.MEDIUM
    else:
        project.risk_level = RiskLevel.LOW

    # Store verdict in audit_logs for retrieval
    audit_log = AuditLog(
        project_id=project_id,
        ai_analysis=verdict.model_dump(),
        flagged_anomalies=[f.rule_broken for f in verdict.flags],
    )
    db.add(audit_log)

    await db.commit()

    logger.info(
        f"Audit complete for project {project_id}: "
        f"risk_score={verdict.contractor_risk_score}, "
        f"flags={len(verdict.flags)}, "
        f"clarifications={len(verdict.clarifications_needed)}"
    )

    return verdict
