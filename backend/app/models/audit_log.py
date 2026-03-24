import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.verification_request import VerificationRequest


class AuditLog(Base):
    """
    AI analysis verdict for a project.
    Stores the "Crime Scene" analysis and flagged anomalies.
    """
    __tablename__ = "audit_logs"

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
    ai_analysis: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Raw AI Crime Scene analysis output",
    )
    flagged_anomalies: Mapped[list[str] | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="e.g., ['Price Inflation', 'Ghost Material', 'Phantom Upgrade']",
    )
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="audit_logs")
    verification_requests: Mapped[List["VerificationRequest"]] = relationship(
        "VerificationRequest",
        back_populates="audit_log",
    )
