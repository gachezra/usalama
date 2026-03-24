"""add_citizen_dispatch_models

Revision ID: c1a2b3d4e5f6
Revises: b05fe0aef822
Create Date: 2026-03-02 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'b05fe0aef822'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Citizen Dispatch models: citizens, verification_requests, verification_feedback."""

    # Create new ENUMs
    dispatch_status = postgresql.ENUM(
        'PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED',
        name='dispatch_status',
        create_type=False,
    )
    feedback_verdict = postgresql.ENUM(
        'CONFIRMED', 'REJECTED', 'INCONCLUSIVE',
        name='feedback_verdict',
        create_type=False,
    )
    dispatch_status.create(op.get_bind(), checkfirst=True)
    feedback_verdict.create(op.get_bind(), checkfirst=True)

    # 1. Citizens table
    op.create_table(
        'citizens',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False, comment='Primary contact — Kenya phone number'),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('county', sa.String(length=100), nullable=False, comment='For geo-proximity task assignment'),
        sa.Column('reputation_score', sa.Integer(), nullable=False, server_default='50', comment='Reliability score 0-100, starts at 50'),
        sa.Column('total_verifications', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('phone'),
    )
    op.create_index(op.f('ix_citizens_phone'), 'citizens', ['phone'], unique=True)
    op.create_index(op.f('ix_citizens_county'), 'citizens', ['county'], unique=False)

    # 2. Verification Requests table
    op.create_table(
        'verification_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('audit_log_id', sa.UUID(), nullable=False, comment='Which AI analysis triggered this dispatch'),
        sa.Column('citizen_id', sa.UUID(), nullable=True, comment='Assigned mwananchi (null until assigned)'),
        sa.Column('question', sa.Text(), nullable=False, comment='Citizen action command from ClarificationRequest.question'),
        sa.Column('context', sa.Text(), nullable=False, comment='Why this evidence is needed'),
        sa.Column('data_point_needed', sa.String(length=255), nullable=False, comment="Specific object to capture (e.g., 'Cement Bag Label')"),
        sa.Column('priority', sa.String(length=20), nullable=False, server_default='MEDIUM', comment='Severity from ClarificationRequest.priority'),
        sa.Column('gps_target_lat', sa.Float(), nullable=True, comment='Project site latitude for geofence validation'),
        sa.Column('gps_target_lng', sa.Float(), nullable=True, comment='Project site longitude for geofence validation'),
        sa.Column('radius_meters', sa.Integer(), nullable=False, server_default='500', comment='Acceptable GPS deviation from target in meters'),
        sa.Column('status', dispatch_status, nullable=False, server_default='PENDING_ASSIGNMENT'),
        sa.Column('assigned_at', sa.DateTime(), nullable=True),
        sa.Column('deadline', sa.DateTime(), nullable=True, comment='Expiry time for this dispatch task'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['audit_log_id'], ['audit_logs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['citizen_id'], ['citizens.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_verification_requests_project_id'), 'verification_requests', ['project_id'], unique=False)
    op.create_index(op.f('ix_verification_requests_audit_log_id'), 'verification_requests', ['audit_log_id'], unique=False)
    op.create_index(op.f('ix_verification_requests_citizen_id'), 'verification_requests', ['citizen_id'], unique=False)

    # 3. Add new columns to verifications table
    op.add_column('verifications', sa.Column(
        'citizen_id', sa.UUID(), nullable=True,
        comment='The mwananchi who submitted this evidence',
    ))
    op.add_column('verifications', sa.Column(
        'request_id', sa.UUID(), nullable=True,
        comment='The dispatch task this verification fulfills',
    ))
    op.add_column('verifications', sa.Column(
        'photo_hash', sa.String(length=64), nullable=True,
        comment='SHA-256 hash of submitted photo for evidence integrity',
    ))
    op.create_foreign_key(
        'fk_verifications_citizen_id', 'verifications', 'citizens',
        ['citizen_id'], ['id'], ondelete='SET NULL',
    )
    op.create_foreign_key(
        'fk_verifications_request_id', 'verifications', 'verification_requests',
        ['request_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('ix_verifications_citizen_id'), 'verifications', ['citizen_id'], unique=False)
    op.create_index(op.f('ix_verifications_request_id'), 'verifications', ['request_id'], unique=False)
    op.create_index(op.f('ix_verifications_photo_hash'), 'verifications', ['photo_hash'], unique=False)

    # 4. Verification Feedback table
    op.create_table(
        'verification_feedback',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('verification_id', sa.UUID(), nullable=False, comment='One feedback per verification submission'),
        sa.Column('reviewed_by', sa.String(length=255), nullable=False, comment='Admin identifier who reviewed this submission'),
        sa.Column('verdict', feedback_verdict, nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('reputation_delta', sa.Integer(), nullable=False, server_default='0', comment='Change to citizen reputation score (+1/-1)'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['verification_id'], ['verifications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('verification_id'),
    )
    op.create_index(op.f('ix_verification_feedback_verification_id'), 'verification_feedback', ['verification_id'], unique=True)


def downgrade() -> None:
    """Remove Citizen Dispatch models."""
    # Drop verification_feedback
    op.drop_index(op.f('ix_verification_feedback_verification_id'), table_name='verification_feedback')
    op.drop_table('verification_feedback')

    # Drop new columns from verifications
    op.drop_index(op.f('ix_verifications_photo_hash'), table_name='verifications')
    op.drop_index(op.f('ix_verifications_request_id'), table_name='verifications')
    op.drop_index(op.f('ix_verifications_citizen_id'), table_name='verifications')
    op.drop_constraint('fk_verifications_request_id', 'verifications', type_='foreignkey')
    op.drop_constraint('fk_verifications_citizen_id', 'verifications', type_='foreignkey')
    op.drop_column('verifications', 'photo_hash')
    op.drop_column('verifications', 'request_id')
    op.drop_column('verifications', 'citizen_id')

    # Drop verification_requests
    op.drop_index(op.f('ix_verification_requests_citizen_id'), table_name='verification_requests')
    op.drop_index(op.f('ix_verification_requests_audit_log_id'), table_name='verification_requests')
    op.drop_index(op.f('ix_verification_requests_project_id'), table_name='verification_requests')
    op.drop_table('verification_requests')

    # Drop citizens
    op.drop_index(op.f('ix_citizens_county'), table_name='citizens')
    op.drop_index(op.f('ix_citizens_phone'), table_name='citizens')
    op.drop_table('citizens')

    # Drop enums
    postgresql.ENUM(name='feedback_verdict').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='dispatch_status').drop(op.get_bind(), checkfirst=True)
