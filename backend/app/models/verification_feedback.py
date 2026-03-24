import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import FeedbackVerdict

if TYPE_CHECKING:
    from app.models.verification import Verification


class VerificationFeedback(Base):
    """
    Admin review of citizen-submitted verification evidence.
    Drives the reputation system — reliable mwananchi earn higher scores.
    """
    __tablename__ = "verification_feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    verification_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("verifications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        comment="One feedback per verification submission",
    )
    reviewed_by: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Admin identifier who reviewed this submission",
    )
    verdict: Mapped[FeedbackVerdict] = mapped_column(
        ENUM(FeedbackVerdict, name="feedback_verdict", create_type=True),
        nullable=False,
    )
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    reputation_delta: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Change to citizen reputation score (+1/-1)",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    verification: Mapped["Verification"] = relationship(
        "Verification",
        back_populates="feedback",
    )
