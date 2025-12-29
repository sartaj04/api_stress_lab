"""Add password reset tokens table

Revision ID: add_password_reset_tokens
Revises: add_credit_billing
Create Date: 2025-12-28

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = 'add_password_reset_tokens'
down_revision = 'add_credit_billing'
branch_labels = None
depends_on = None


def upgrade():
    # Check if table already exists (handles partial migration runs)
    conn = op.get_bind()
    inspector = inspect(conn)
    tables = inspector.get_table_names()
    
    if 'password_reset_tokens' not in tables:
        # Create password_reset_tokens table
        # Note: primary_key=True automatically creates an index on 'id'
        #       unique=True automatically creates an index on 'token'
        op.create_table(
            'password_reset_tokens',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('token', sa.String(255), nullable=False, unique=True),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('used', sa.Boolean(), nullable=False, server_default='false'),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
        )
        # Create index on user_id (not automatically created)
        op.create_index('ix_password_reset_tokens_user_id', 'password_reset_tokens', ['user_id'], unique=False)
    else:
        # Table exists, check and clean up any redundant indexes from partial migration
        indexes = [idx['name'] for idx in inspector.get_indexes('password_reset_tokens')]
        
        # Drop redundant index on 'id' if it exists (primary key already has an index)
        if 'ix_password_reset_tokens_id' in indexes:
            try:
                op.drop_index('ix_password_reset_tokens_id', table_name='password_reset_tokens')
            except Exception:
                pass  # Ignore if already dropped or doesn't exist
        
        # Create user_id index if it doesn't exist
        if 'ix_password_reset_tokens_user_id' not in indexes:
            op.create_index('ix_password_reset_tokens_user_id', 'password_reset_tokens', ['user_id'], unique=False)


def downgrade():
    # Drop password_reset_tokens table
    # Indexes on primary key and unique columns are automatically dropped with the table
    op.drop_index('ix_password_reset_tokens_user_id', table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')

