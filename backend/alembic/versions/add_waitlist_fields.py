"""Add waitlist fields to users table

Revision ID: add_waitlist_fields
Revises: add_password_reset_tokens
Create Date: 2025-12-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = 'add_waitlist_fields'
down_revision = 'add_password_reset_tokens'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    # Add observability_waitlist_joined column if it doesn't exist
    if 'observability_waitlist_joined' not in columns:
        op.add_column('users', sa.Column('observability_waitlist_joined', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add waitlist_joined_at column if it doesn't exist
    if 'waitlist_joined_at' not in columns:
        op.add_column('users', sa.Column('waitlist_joined_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    # Remove waitlist columns
    op.drop_column('users', 'waitlist_joined_at')
    op.drop_column('users', 'observability_waitlist_joined')

