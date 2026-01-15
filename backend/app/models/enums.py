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
