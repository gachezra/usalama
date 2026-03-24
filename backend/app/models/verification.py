import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import VerificationStatus

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.citizen import Citizen
    from app.models.verification_request import VerificationRequest
    from app.models.verification_feedback import VerificationFeedback


class Verification(Base):
    """
    Citizen verification record.
    The mwananchi's eye on the ground - GPS-tagged photo evidence.
    """
    __tablename__ = "verifications"

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
    citizen_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizens.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="The mwananchi who submitted this evidence",
    )
    request_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("verification_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="The dispatch task this verification fulfills",
    )
    gps_lat: Mapped[float] = mapped_column(Float, nullable=False)
    gps_lng: Mapped[float] = mapped_column(Float, nullable=False)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
    photo_hash: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        comment="SHA-256 hash of submitted photo for evidence integrity",
    )
    is_off_site: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="True if GPS does not match project location - potential fraud indicator",
    )
    status: Mapped[VerificationStatus] = mapped_column(
        ENUM(VerificationStatus, name="verification_status", create_type=True),
        default=VerificationStatus.PENDING,
        nullable=False,
    )
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="verifications")
    citizen: Mapped[Optional["Citizen"]] = relationship("Citizen", back_populates="verifications")
    request: Mapped[Optional["VerificationRequest"]] = relationship(
        "VerificationRequest", back_populates="verification"
    )
    feedback: Mapped[Optional["VerificationFeedback"]] = relationship(
        "VerificationFeedback", back_populates="verification", uselist=False
    )
