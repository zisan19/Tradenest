"""align marketplace columns with current models

Revision ID: 0003_align_marketplace_columns
Revises: 0002_add_user_verification_flag
Create Date: 2026-08-22
"""
from alembic import op
import sqlalchemy as sa


revision = "0003_align_marketplace_columns"
down_revision = "0002_add_user_verification_flag"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("categories") as batch_op:
        batch_op.add_column(sa.Column("slug", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("icon", sa.String(), nullable=True))

    with op.batch_alter_table("products") as batch_op:
        batch_op.add_column(sa.Column("image_url", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("1")))
        batch_op.add_column(sa.Column("created_at", sa.DateTime(), nullable=True))

    connection = op.get_bind()
    categories = sa.table(
        "categories",
        sa.column("id", sa.Integer()),
        sa.column("name", sa.String()),
        sa.column("slug", sa.String()),
    )
    for category_id, name in connection.execute(sa.select(categories.c.id, categories.c.name)).fetchall():
        slug = name.strip().lower().replace(" ", "-")
        connection.execute(categories.update().where(categories.c.id == category_id).values(slug=slug))

    products = sa.table("products", sa.column("image", sa.String()), sa.column("image_url", sa.String()))
    connection.execute(products.update().where(products.c.image_url.is_(None)).values(image_url=products.c.image))
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)


def downgrade():
    op.drop_index("ix_categories_slug", table_name="categories")
    with op.batch_alter_table("products") as batch_op:
        batch_op.drop_column("created_at")
        batch_op.drop_column("is_approved")
        batch_op.drop_column("image_url")
    with op.batch_alter_table("categories") as batch_op:
        batch_op.drop_column("icon")
        batch_op.drop_column("slug")
