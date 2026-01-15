import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import VerificationStatus

if TYPE_CHECKING:
    from app.models.project import Project


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
    gps_lat: Mapped[float] = mapped_column(Float, nullable=False)
    gps_lng: Mapped[float] = mapped_column(Float, nullable=False)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=False)
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
