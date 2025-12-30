"""Add email verification fields to users table

Revision ID: add_email_verification_fields
Revises: add_waitlist_fields
Create Date: 2025-12-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = 'add_email_verification_fields'
down_revision = 'add_waitlist_fields'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]

    # Add email_verified column if it doesn't exist
    if 'email_verified' not in columns:
        op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))

    # Add email_verified_at column if it doesn't exist
    if 'email_verified_at' not in columns:
        op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))

    # Mark all existing users as verified (grandfather them in)
    # This includes both email and Google OAuth users
    op.execute("""
        UPDATE users
        SET email_verified = true,
            email_verified_at = NOW()
        WHERE email_verified = false
    """)


def downgrade():
    # Remove email verification columns
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'email_verified')
