import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, TYPE_CHECKING

from sqlalchemy import String, Text, Numeric, Integer, Date, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ProjectStatus, RiskLevel

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.audit_log import AuditLog
    from app.models.verification import Verification


class Project(Base):
    """
    Government project under oversight.
    Central entity linking documents, AI analysis, and citizen verifications.
    """
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    county: Mapped[str] = mapped_column(String(100), nullable=False)
    constituency: Mapped[str] = mapped_column(String(100), nullable=False)
    contractor_name: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
        comment="Indexed for tracking bad actors across projects",
    )
    total_budget: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        comment="Supports up to 999 billion KES",
    )
    status: Mapped[ProjectStatus] = mapped_column(
        ENUM(ProjectStatus, name="project_status", create_type=True),
        default=ProjectStatus.PLANNED,
        nullable=False,
    )
    risk_score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="AI-computed score 0-100",
    )
    risk_level: Mapped[RiskLevel] = mapped_column(
        ENUM(RiskLevel, name="risk_level", create_type=True),
        default=RiskLevel.LOW,
        nullable=False,
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    verifications: Mapped[List["Verification"]] = relationship(
        "Verification",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_projects_county_status", "county", "status"),
    )
