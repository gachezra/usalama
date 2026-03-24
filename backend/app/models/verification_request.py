import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import DispatchStatus

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.audit_log import AuditLog
    from app.models.citizen import Citizen
    from app.models.verification import Verification


class VerificationRequest(Base):
    """
    Dispatch task — bridges AI ClarificationRequests to citizen field verification.
    Created when ForensicBrain identifies data gaps requiring on-site evidence.
    """
    __tablename__ = "verification_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    audit_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("audit_logs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Which AI analysis triggered this dispatch",
    )
    citizen_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizens.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Assigned mwananchi (null until assigned)",
    )

    # From ClarificationRequest
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Citizen action command from ClarificationRequest.question",
    )
    context: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Why this evidence is needed",
    )
    data_point_needed: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Specific object to capture (e.g., 'Cement Bag Label')",
    )
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="MEDIUM",
        comment="Severity from ClarificationRequest.priority",
    )

    # GPS targeting
    gps_target_lat: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Project site latitude for geofence validation",
    )
    gps_target_lng: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Project site longitude for geofence validation",
    )
    radius_meters: Mapped[int] = mapped_column(
        Integer,
        default=500,
        nullable=False,
        comment="Acceptable GPS deviation from target in meters",
    )

    # Lifecycle
    status: Mapped[DispatchStatus] = mapped_column(
        ENUM(DispatchStatus, name="dispatch_status", create_type=True),
        default=DispatchStatus.PENDING_ASSIGNMENT,
        nullable=False,
    )
    assigned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )
    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        comment="Expiry time for this dispatch task",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="verification_requests")
    audit_log: Mapped["AuditLog"] = relationship("AuditLog", back_populates="verification_requests")
    citizen: Mapped[Optional["Citizen"]] = relationship("Citizen", back_populates="verification_requests")
    verification: Mapped[Optional["Verification"]] = relationship(
        "Verification",
        back_populates="request",
        uselist=False,
    )
