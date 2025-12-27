"""Add credit-based billing

Revision ID: add_credit_billing
Revises: add_stripe_billing
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa


revision = 'add_credit_billing'
down_revision = 'add_stripe_billing'
branch_labels = None
depends_on = None


def upgrade():
    # Drop subscription table (no longer needed)
    op.drop_index('ix_subscriptions_stripe_subscription_id', table_name='subscriptions')
    op.drop_table('subscriptions')
    
    # Remove subscription fields from users
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'monthly_runs_used')
    
    # Add credit fields to users
    op.add_column('users', sa.Column('credit_balance', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('free_credits_claimed', sa.Boolean(), nullable=False, server_default='false'))
    
    # Create credit_transactions table
    op.create_table(
        'credit_transactions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('transaction_type', sa.String(50), nullable=False),
        sa.Column('stripe_payment_id', sa.String(255), nullable=True),
        sa.Column('package_name', sa.String(100), nullable=True),
        sa.Column('run_id', sa.Integer(), sa.ForeignKey('runs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Add credits_charged to runs
    op.add_column('runs', sa.Column('credits_charged', sa.Integer(), nullable=True))


def downgrade():
    # Remove credits_charged from runs
    op.drop_column('runs', 'credits_charged')
    
    # Drop credit_transactions
    op.drop_table('credit_transactions')
    
    # Remove credit fields from users
    op.drop_column('users', 'free_credits_claimed')
    op.drop_column('users', 'credit_balance')
    
    # Re-add subscription fields
    op.add_column('users', sa.Column('monthly_runs_used', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('subscription_status', sa.String(50), nullable=False, server_default='inactive'))
    
    # Re-create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=False, unique=True),
        sa.Column('stripe_price_id', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    op.create_index('ix_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'], unique=True)
