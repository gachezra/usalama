import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import String, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.verification_request import VerificationRequest
    from app.models.verification import Verification


class Citizen(Base):
    """
    Citizen identity for the mwananchi verification network.
    Tracks reputation and geo-proximity for task assignment.
    """
    __tablename__ = "citizens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
        comment="Primary contact — Kenya phone number",
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    county: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="For geo-proximity task assignment",
    )
    reputation_score: Mapped[int] = mapped_column(
        Integer,
        default=50,
        nullable=False,
        comment="Reliability score 0-100, starts at 50",
    )
    total_verifications: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    verification_requests: Mapped[List["VerificationRequest"]] = relationship(
        "VerificationRequest",
        back_populates="citizen",
    )
    verifications: Mapped[List["Verification"]] = relationship(
        "Verification",
        back_populates="citizen",
    )
