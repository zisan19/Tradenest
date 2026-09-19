"""add user verification flag

Revision ID: 0002_add_user_verification_flag
Revises: 0001_add_refresh_tokens
Create Date: 2026-08-22
"""
from alembic import op
import sqlalchemy as sa


revision = "0002_add_user_verification_flag"
down_revision = "0001_add_refresh_tokens"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("0"))
        )


def downgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("is_verified")
