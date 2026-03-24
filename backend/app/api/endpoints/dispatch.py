"""
USALAMA Citizen Dispatch API Endpoints
The nervous system connecting AI analysis to citizen field verification.
"""
import hashlib
import logging
import math
import os
import secrets
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, Form
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.project import Project
from app.models.audit_log import AuditLog
from app.models.citizen import Citizen
from app.models.verification import Verification
from app.models.verification_request import VerificationRequest
from app.models.verification_feedback import VerificationFeedback
from app.models.enums import (
    DispatchStatus,
    FeedbackVerdict,
    VerificationStatus,
    RiskLevel,
    ProjectStatus,
)
from app.schemas.dispatch import (
    CitizenCreate,
    CitizenResponse,
    LeaderboardEntry,
    DispatchCreate,
    DispatchResponse,
    DispatchBatchResponse,
    VerificationSubmit,
    VerificationResponse,
    FeedbackCreate,
    FeedbackResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["dispatch"])


# --- Citizen Registration ---

@router.post("/citizens", response_model=CitizenResponse, status_code=status.HTTP_201_CREATED)
async def register_citizen(
    data: CitizenCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new citizen verifier (mwananchi)."""
    # Check for duplicate phone
    existing = await db.execute(
        select(Citizen).where(Citizen.phone == data.phone)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Citizen with phone {data.phone} already registered",
        )

    citizen = Citizen(
        phone=data.phone,
        name=data.name,
        county=data.county,
    )
    db.add(citizen)
    await db.commit()
    await db.refresh(citizen)

    logger.info(f"Citizen registered: {citizen.id} - {citizen.name} ({citizen.county})")
    return citizen


@router.get("/citizens/leaderboard", response_model=List[LeaderboardEntry])
async def citizen_leaderboard(
    limit: int = 20,
    county: str = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Reputation leaderboard — top mwananchi verifiers.
    Rewards reliable citizens with visibility.
    """
    query = (
        select(Citizen)
        .where(Citizen.is_active == True)  # noqa: E712
        .order_by(desc(Citizen.reputation_score), desc(Citizen.total_verifications))
        .limit(limit)
    )
    if county:
        query = query.where(Citizen.county == county)

    result = await db.execute(query)
    citizens = result.scalars().all()

    return [
        LeaderboardEntry(
            id=c.id,
            name=c.name,
            county=c.county,
            reputation_score=c.reputation_score,
            total_verifications=c.total_verifications,
        )
        for c in citizens
    ]


# --- Dispatch: Create from Audit ---

@router.post(
    "/projects/{project_id}/dispatch",
    response_model=DispatchBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dispatch_from_audit(
    project_id: uuid.UUID,
    data: DispatchCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create VerificationRequests from the latest audit's ClarificationRequests.

    Bridges AI analysis to citizen field work:
    AI generates ClarificationRequest -> This endpoint creates dispatchable tasks.
    """
    # Verify project exists
    project_result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found",
        )

    # Get latest audit log
    audit_result = await db.execute(
        select(AuditLog)
        .where(AuditLog.project_id == project_id)
        .order_by(desc(AuditLog.analyzed_at))
        .limit(1)
    )
    audit_log = audit_result.scalar_one_or_none()
    if not audit_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audit has been run for this project. Run /audit first.",
        )

    # Extract clarifications_needed from ai_analysis JSONB
    ai_analysis = audit_log.ai_analysis or {}
    clarifications = ai_analysis.get("clarifications_needed", [])

    if not clarifications:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Latest audit has no clarification requests to dispatch.",
        )

    # Create VerificationRequest for each ClarificationRequest
    tasks = []
    for clar in clarifications:
        vr = VerificationRequest(
            project_id=project_id,
            audit_log_id=audit_log.id,
            question=clar.get("question", "Verification needed"),
            context=clar.get("context", ""),
            data_point_needed=clar.get("data_point_needed", "Unspecified"),
            priority=clar.get("priority", "MEDIUM"),
            gps_target_lat=data.gps_target_lat,
            gps_target_lng=data.gps_target_lng,
            radius_meters=data.radius_meters,
            deadline=data.deadline,
        )
        db.add(vr)
        tasks.append(vr)

    await db.commit()

    # Refresh all tasks to get IDs
    for task in tasks:
        await db.refresh(task)

    logger.info(
        f"Dispatched {len(tasks)} verification tasks for project {project_id} "
        f"from audit {audit_log.id}"
    )

    return DispatchBatchResponse(
        dispatched=len(tasks),
        tasks=[DispatchResponse.model_validate(t) for t in tasks],
    )


# --- Dispatch: List Pending ---

@router.get("/dispatch/pending", response_model=List[DispatchResponse])
async def list_pending_dispatch(
    county: str = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """
    List unassigned verification tasks (for assignment UI).
    Optionally filter by county for geo-proximity matching.
    """
    query = (
        select(VerificationRequest)
        .where(VerificationRequest.status == DispatchStatus.PENDING_ASSIGNMENT)
        .order_by(
            # CRITICAL priority first
            VerificationRequest.priority.desc(),
            VerificationRequest.created_at.asc(),
        )
        .limit(limit)
    )

    if county:
        # Filter by project county for geo-proximity
        query = query.join(Project).where(Project.county == county)

    result = await db.execute(query)
    tasks = result.scalars().all()
    return [DispatchResponse.model_validate(t) for t in tasks]


# --- Verification: Get Task Details (Citizen Link) ---

@router.get("/verifications/{request_id}", response_model=DispatchResponse)
async def get_verification_task(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get verification task details for the citizen UI.
    No auth required — the UUID itself is the capability token.
    Used by the citizen verification page to display task info.
    """
    result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.id == request_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification task {request_id} not found",
        )
    return DispatchResponse.model_validate(task)


# --- Dispatch: Assign to Citizen ---

@router.post("/dispatch/{dispatch_id}/assign/{citizen_id}", response_model=DispatchResponse)
async def assign_dispatch(
    dispatch_id: uuid.UUID,
    citizen_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Assign a verification task to a specific citizen.
    Only assigns if task is PENDING_ASSIGNMENT and citizen is active.
    """
    # Fetch dispatch task
    task_result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.id == dispatch_id)
    )
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispatch task {dispatch_id} not found",
        )

    if task.status != DispatchStatus.PENDING_ASSIGNMENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is {task.status.value}, cannot assign (must be PENDING_ASSIGNMENT)",
        )

    # Fetch citizen
    citizen_result = await db.execute(
        select(Citizen).where(Citizen.id == citizen_id)
    )
    citizen = citizen_result.scalar_one_or_none()
    if not citizen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Citizen {citizen_id} not found",
        )
    if not citizen.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Citizen {citizen.name} is deactivated",
        )

    # Assign
    task.citizen_id = citizen.id
    task.status = DispatchStatus.ASSIGNED
    task.assigned_at = datetime.utcnow()

    await db.commit()
    await db.refresh(task)

    logger.info(f"Dispatch {dispatch_id} assigned to citizen {citizen.name} ({citizen_id})")
    return DispatchResponse.model_validate(task)


# --- Citizen: My Tasks ---

@router.get("/citizen/{citizen_id}/tasks", response_model=List[DispatchResponse])
async def get_citizen_tasks(
    citizen_id: uuid.UUID,
    include_completed: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all verification tasks assigned to a citizen.
    By default excludes completed/expired/cancelled tasks.
    """
    # Verify citizen exists
    citizen_result = await db.execute(
        select(Citizen).where(Citizen.id == citizen_id)
    )
    if not citizen_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Citizen {citizen_id} not found",
        )

    query = (
        select(VerificationRequest)
        .where(VerificationRequest.citizen_id == citizen_id)
        .order_by(VerificationRequest.created_at.desc())
    )

    if not include_completed:
        query = query.where(
            VerificationRequest.status.in_([
                DispatchStatus.ASSIGNED,
                DispatchStatus.IN_PROGRESS,
            ])
        )

    result = await db.execute(query)
    tasks = result.scalars().all()
    return [DispatchResponse.model_validate(t) for t in tasks]


# --- Citizen: Submit Verification ---

def _haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two GPS coordinates in meters."""
    R = 6_371_000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.post("/dispatch/{dispatch_id}/submit", response_model=VerificationResponse)
async def submit_verification(
    dispatch_id: uuid.UUID,
    data: VerificationSubmit,
    db: AsyncSession = Depends(get_db),
):
    """
    Citizen submits photo verification for a dispatch task.

    Automatically:
    1. Validates GPS geofence (is the citizen at the project site?)
    2. Sets is_off_site flag for fraud detection
    3. Links verification to dispatch task and citizen
    4. Updates task status to COMPLETED
    """
    # Fetch dispatch task
    task_result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.id == dispatch_id)
    )
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispatch task {dispatch_id} not found",
        )

    # Allow submission even if not explicitly assigned (Walk-in logic)
    allowed_statuses = [
        DispatchStatus.PENDING_ASSIGNMENT,
        DispatchStatus.ASSIGNED,
        DispatchStatus.IN_PROGRESS,
    ]
    if task.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is {task.status.value}, cannot submit",
        )

    # Geofence validation — auto-detect off-site fraud
    is_off_site = False
    if task.gps_target_lat is not None and task.gps_target_lng is not None:
        distance = _haversine_meters(
            data.gps_lat, data.gps_lng,
            task.gps_target_lat, task.gps_target_lng,
        )
        is_off_site = distance > task.radius_meters
        if is_off_site:
            logger.warning(
                f"Anomaly Detected: Citizen submitted verification {distance:.0f}m "
                f"from target site (limit: {task.radius_meters}m) for dispatch {dispatch_id}"
            )

    # Create verification record
    verification = Verification(
        project_id=task.project_id,
        citizen_id=task.citizen_id,
        request_id=task.id,
        gps_lat=data.gps_lat,
        gps_lng=data.gps_lng,
        photo_url=data.photo_url,
        photo_hash=data.photo_hash,
        is_off_site=is_off_site,
        status=VerificationStatus.PENDING,
    )
    db.add(verification)

    # Update dispatch task status
    task.status = DispatchStatus.COMPLETED

    # Increment citizen's verification count (if assigned)
    if task.citizen_id:
        citizen_result = await db.execute(
            select(Citizen).where(Citizen.id == task.citizen_id)
        )
        citizen = citizen_result.scalar_one_or_none()
        if citizen:
            citizen.total_verifications += 1

    await db.commit()
    await db.refresh(verification)

    logger.info(
        f"Verification submitted for dispatch {dispatch_id}: "
        f"off_site={is_off_site}, citizen={task.citizen_id}"
    )

    return VerificationResponse.model_validate(verification)


# --- Citizen: File Upload Submission (Closing Loop) ---

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "uploads", "verifications")
GEOFENCE_LIMIT_METERS = 2000


@router.post("/verifications/{request_id}/submit", response_model=VerificationResponse)
async def submit_verification_upload(
    request_id: uuid.UUID,
    file: UploadFile,
    latitude: float = Form(...),
    longitude: float = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Citizen submits photo evidence via file upload for a dispatch task.

    The Closing Loop:
    1. Saves photo to disk and computes SHA-256 hash (evidence integrity)
    2. Validates GPS geofence using Haversine distance (is the citizen on-site?)
    3. Simulates M-Pesa Daraja B2C reward payment on acceptance
    4. Creates Verification record and marks dispatch task COMPLETED

    Relaxed guard: accepts tasks in PENDING_ASSIGNMENT, ASSIGNED, or IN_PROGRESS
    status and does not require a pre-assigned citizen_id (for demo/testing).
    """
    # 1. Fetch VerificationRequest
    task_result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.id == request_id)
    )
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification request {request_id} not found",
        )

    # Relaxed status check — allow PENDING_ASSIGNMENT for easy Swagger testing
    allowed_statuses = (
        DispatchStatus.PENDING_ASSIGNMENT,
        DispatchStatus.ASSIGNED,
        DispatchStatus.IN_PROGRESS,
    )
    if task.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task is {task.status.value}, cannot submit (must be PENDING_ASSIGNMENT, ASSIGNED, or IN_PROGRESS)",
        )

    # 2. Fetch Project for logging context
    project_result = await db.execute(
        select(Project).where(Project.id == task.project_id)
    )
    project = project_result.scalar_one_or_none()
    project_title = project.title if project else "Unknown"

    # 3. Save file to disk
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    file_contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(file_contents)

    # 4. Compute SHA-256 hash of file contents
    photo_hash = hashlib.sha256(file_contents).hexdigest()
    logger.info(f"Evidence saved: {safe_filename} | SHA-256: {photo_hash}")

    # 5. GPS Validation using Haversine
    is_off_site = False
    verification_status = VerificationStatus.PENDING

    if task.gps_target_lat is not None and task.gps_target_lng is not None:
        distance = _haversine_meters(
            latitude, longitude,
            task.gps_target_lat, task.gps_target_lng,
        )

        if distance > GEOFENCE_LIMIT_METERS:
            # REJECT — citizen is off-site
            logger.warning(
                f"GPS Mismatch: Citizen is off-site. "
                f"Distance: {distance:.0f}m from target (limit: {GEOFENCE_LIMIT_METERS}m) "
                f"| Project: {project_title} | Task: {request_id}"
            )
            is_off_site = True
            verification_status = VerificationStatus.REJECTED
        else:
            # ACCEPT — citizen is on-site
            logger.info(
                f"Processing anonymous submission for Task {request_id}. "
                f"GPS Delta: {distance:.0f}m. Triggering Escrow Payout."
            )
            is_off_site = False
            verification_status = VerificationStatus.PENDING

            # Simulate M-Pesa Daraja B2C payment
            transaction_id = "R" + secrets.token_hex(4).upper()
            logger.info("INITIATING DARAJA PAYMENT...")
            logger.info(f"B2C Transaction: Sending KES 50 to Citizen...")
            logger.info(f"Payment Successful. Transaction ID: {transaction_id}")
    else:
        logger.info(
            f"Processing anonymous submission for Task {request_id}. "
            f"No GPS target set — skipping geofence. Triggering Escrow Payout."
        )
        # Simulate M-Pesa Daraja B2C payment for no-geofence case too
        transaction_id = "R" + secrets.token_hex(4).upper()
        logger.info("INITIATING DARAJA PAYMENT...")
        logger.info(f"B2C Transaction: Sending KES 50 to Citizen...")
        logger.info(f"Payment Successful. Transaction ID: {transaction_id}")

    # 6. Create Verification record
    verification = Verification(
        project_id=task.project_id,
        citizen_id=task.citizen_id,  # May be None (relaxed guard)
        request_id=task.id,
        gps_lat=latitude,
        gps_lng=longitude,
        photo_url=file_path,
        photo_hash=photo_hash,
        is_off_site=is_off_site,
        status=verification_status,
    )
    db.add(verification)

    # 7. Update dispatch task status → COMPLETED
    task.status = DispatchStatus.COMPLETED

    # 8. Increment citizen verification count (if assigned)
    if task.citizen_id:
        citizen_result = await db.execute(
            select(Citizen).where(Citizen.id == task.citizen_id)
        )
        citizen = citizen_result.scalar_one_or_none()
        if citizen:
            citizen.total_verifications += 1

    await db.commit()
    await db.refresh(verification)

    logger.info(
        f"Verification submitted for task {request_id}: "
        f"off_site={is_off_site}, status={verification_status.value}, "
        f"citizen={task.citizen_id or 'unassigned'}"
    )

    return VerificationResponse.model_validate(verification)


# --- Admin: Feedback on Verification ---

@router.post("/verifications/{verification_id}/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    verification_id: uuid.UUID,
    data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Admin reviews a citizen's verification submission.

    Updates:
    1. Verification status (VERIFIED/REJECTED based on verdict)
    2. Citizen reputation score
    3. Project risk score (if feedback confirms or rejects findings)
    """
    # Fetch verification with related data
    ver_result = await db.execute(
        select(Verification).where(Verification.id == verification_id)
    )
    verification = ver_result.scalar_one_or_none()
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification {verification_id} not found",
        )

    # Check for duplicate feedback
    existing = await db.execute(
        select(VerificationFeedback).where(
            VerificationFeedback.verification_id == verification_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Feedback already submitted for this verification",
        )

    # Create feedback
    feedback = VerificationFeedback(
        verification_id=verification_id,
        reviewed_by=data.reviewed_by,
        verdict=data.verdict,
        comment=data.comment,
        reputation_delta=data.reputation_delta,
    )
    db.add(feedback)

    # Update verification status
    if data.verdict == FeedbackVerdict.CONFIRMED:
        verification.status = VerificationStatus.VERIFIED
    elif data.verdict == FeedbackVerdict.REJECTED:
        verification.status = VerificationStatus.REJECTED

    # Update citizen reputation
    if verification.citizen_id and data.reputation_delta != 0:
        citizen_result = await db.execute(
            select(Citizen).where(Citizen.id == verification.citizen_id)
        )
        citizen = citizen_result.scalar_one_or_none()
        if citizen:
            citizen.reputation_score = max(0, min(100, citizen.reputation_score + data.reputation_delta))
            logger.info(
                f"Citizen {citizen.name} reputation: {citizen.reputation_score} "
                f"(delta: {data.reputation_delta:+d})"
            )

    # Update project risk if verification confirms corruption
    if data.verdict == FeedbackVerdict.CONFIRMED and verification.is_off_site:
        project_result = await db.execute(
            select(Project).where(Project.id == verification.project_id)
        )
        project = project_result.scalar_one_or_none()
        if project:
            # Off-site submission confirmed — escalate risk
            project.risk_score = min(100, project.risk_score + 10)
            if project.risk_score >= 75:
                project.risk_level = RiskLevel.CRITICAL
                project.status = ProjectStatus.FLAGGED
            elif project.risk_score >= 50:
                project.risk_level = RiskLevel.HIGH
            logger.info(
                f"Project {project.title} risk escalated to {project.risk_score} "
                f"after confirmed off-site verification"
            )

    await db.commit()
    await db.refresh(feedback)

    logger.info(
        f"Feedback submitted for verification {verification_id}: "
        f"verdict={data.verdict.value}, reviewed_by={data.reviewed_by}"
    )

    return FeedbackResponse.model_validate(feedback)
