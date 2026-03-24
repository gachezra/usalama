import enum


class ProjectStatus(str, enum.Enum):
    """
    Project lifecycle status.
    FLAGGED indicates potential corruption detected.
    """
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    STALLED = "STALLED"
    FLAGGED = "FLAGGED"


class RiskLevel(str, enum.Enum):
    """
    AI-assessed corruption risk level.
    Based on anomaly detection and historical patterns.
    """
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class VerificationStatus(str, enum.Enum):
    """
    Citizen verification status.
    Tracks the mwananchi's verdict on project claims.
    """
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class DispatchStatus(str, enum.Enum):
    """
    Verification dispatch task lifecycle.
    Tracks progress from AI-generated request to citizen completion.
    """
    PENDING_ASSIGNMENT = "PENDING_ASSIGNMENT"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class FeedbackVerdict(str, enum.Enum):
    """
    Admin review verdict on citizen-submitted verification evidence.
    """
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    INCONCLUSIVE = "INCONCLUSIVE"
