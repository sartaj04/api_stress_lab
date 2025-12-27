"""initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('tier', sa.String(50), nullable=False, server_default='free'),
        sa.Column('monthly_requests_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('monthly_reset_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # API Keys table
    op.create_table(
        'api_keys',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('key_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('base_url', sa.String(2048), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_projects_user_id', 'projects', ['user_id'])

    # Project secrets table (encrypted)
    op.create_table(
        'project_secrets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('auth_type', sa.String(50), nullable=False),
        sa.Column('encrypted_value', sa.Text(), nullable=False),
        sa.Column('header_name', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Specs table
    op.create_table(
        'specs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('minio_key', sa.String(512), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Scenarios table
    op.create_table(
        'scenarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('spec_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('config', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['spec_id'], ['specs.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Runs table
    op.create_table(
        'runs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('scenario_id', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('config', postgresql.JSONB(), nullable=False),
        sa.Column('requested_requests', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('actual_requests', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['scenario_id'], ['scenarios.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_runs_project_id', 'runs', ['project_id'])
    op.create_index('ix_runs_user_id', 'runs', ['user_id'])

    # Run metrics timeseries
    op.create_table(
        'run_metrics_timeseries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.Integer(), nullable=False),
        sa.Column('time_bucket', sa.Integer(), nullable=False),
        sa.Column('rps', sa.Float(), nullable=False),
        sa.Column('error_rate', sa.Float(), nullable=False),
        sa.Column('p50', sa.Float(), nullable=False),
        sa.Column('p95', sa.Float(), nullable=False),
        sa.Column('p99', sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(['run_id'], ['runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_run_metrics_timeseries_run_id', 'run_metrics_timeseries', ['run_id'])

    # Run endpoint metrics
    op.create_table(
        'run_endpoint_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.Integer(), nullable=False),
        sa.Column('method', sa.String(10), nullable=False),
        sa.Column('path', sa.String(2048), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('avg_latency', sa.Float(), nullable=False),
        sa.Column('p50', sa.Float(), nullable=False),
        sa.Column('p95', sa.Float(), nullable=False),
        sa.Column('p99', sa.Float(), nullable=False),
        sa.Column('error_rate', sa.Float(), nullable=False),
        sa.Column('status_codes', postgresql.JSONB(), nullable=False),
        sa.ForeignKeyConstraint(['run_id'], ['runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_run_endpoint_metrics_run_id', 'run_endpoint_metrics', ['run_id'])

    # Run artifacts
    op.create_table(
        'run_artifacts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('run_id', sa.Integer(), nullable=False),
        sa.Column('artifact_type', sa.String(50), nullable=False),
        sa.Column('minio_key', sa.String(512), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['run_id'], ['runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('run_artifacts')
    op.drop_table('run_endpoint_metrics')
    op.drop_table('run_metrics_timeseries')
    op.drop_table('runs')
    op.drop_table('scenarios')
    op.drop_table('specs')
    op.drop_table('project_secrets')
    op.drop_table('projects')
    op.drop_table('api_keys')
    op.drop_table('users')
