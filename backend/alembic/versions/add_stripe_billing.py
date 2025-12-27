"""Add Stripe billing fields and subscriptions table

Revision ID: add_stripe_billing
Revises: 26fcba92fc96
Create Date: 2025-12-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_stripe_billing'
down_revision = '26fcba92fc96'
branch_labels = None
depends_on = None


def upgrade():
    # Add Stripe fields to users table
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('subscription_status', sa.String(50), nullable=False, server_default='inactive'))
    
    # Rename monthly_requests_used to monthly_runs_used
    op.alter_column('users', 'monthly_requests_used', new_column_name='monthly_runs_used')
    
    # Create unique index on stripe_customer_id
    op.create_index('ix_users_stripe_customer_id', 'users', ['stripe_customer_id'], unique=True)
    
    # Create subscriptions table
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
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    op.create_index('ix_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'], unique=True)


def downgrade():
    # Drop subscriptions table
    op.drop_index('ix_subscriptions_stripe_subscription_id', table_name='subscriptions')
    op.drop_table('subscriptions')
    
    # Remove Stripe fields from users
    op.drop_index('ix_users_stripe_customer_id', table_name='users')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'stripe_customer_id')
    
    # Rename back
    op.alter_column('users', 'monthly_runs_used', new_column_name='monthly_requests_used')
