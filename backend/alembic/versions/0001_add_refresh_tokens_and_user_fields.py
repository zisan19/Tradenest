"""add refresh tokens and user fields

Revision ID: 0001_add_refresh_tokens
Revises: 
Create Date: 2026-08-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '0001_add_refresh_tokens'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add columns to users table
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('failed_login_attempts', sa.Integer(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('last_failed_login', sa.DateTime(), nullable=True))

    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('jti', sa.String(), nullable=False, unique=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('issued_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default=sa.text('0')),
    )


def downgrade():
    op.drop_table('refresh_tokens')
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('last_failed_login')
        batch_op.drop_column('failed_login_attempts')
