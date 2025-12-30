"""Add email verification tokens table

Revision ID: add_email_verification_tokens
Revises: add_email_verification_fields
Create Date: 2025-12-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = 'add_email_verification_tokens'
down_revision = 'add_email_verification_fields'
branch_labels = None
depends_on = None


def upgrade():
    # Check if table already exists (handles partial migration runs)
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()

    if 'email_verification_tokens' not in tables:
        # Create email_verification_tokens table
        # Note: primary_key=True automatically creates an index on 'id'
        #       unique=True automatically creates an index on 'token'
        op.create_table(
            'email_verification_tokens',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('token', sa.String(255), nullable=False, unique=True),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
        )
        # Create index on user_id (not automatically created)
        op.create_index('ix_email_verification_tokens_user_id', 'email_verification_tokens', ['user_id'], unique=False)
    else:
        # Table exists, ensure indexes are correct
        indexes = [idx['name'] for idx in inspector.get_indexes('email_verification_tokens')]

        # Create user_id index if it doesn't exist
        if 'ix_email_verification_tokens_user_id' not in indexes:
            op.create_index('ix_email_verification_tokens_user_id', 'email_verification_tokens', ['user_id'], unique=False)


def downgrade():
    # Drop email_verification_tokens table
    # Indexes on primary key and unique columns are automatically dropped with the table
    op.drop_index('ix_email_verification_tokens_user_id', table_name='email_verification_tokens')
    op.drop_table('email_verification_tokens')
