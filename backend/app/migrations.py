"""Lightweight, idempotent column migrations for existing SQLite installs.

Alembic remains the canonical migration path. This module only adds the
columns/tables introduced by the dashboard work so existing local databases
keep booting without a manual `alembic upgrade head`. New columns default to
sensible values (approved/active) so current buyer/checkout flows are
untouched. Shared by the FastAPI startup hook and the seed script.
"""
from sqlalchemy import inspect, text

from .database import engine, Base
from . import models


def run_lightweight_migrations() -> None:
    inspector = inspect(engine)

    def table_exists(name: str) -> bool:
        return name in inspector.get_table_names()

    def add_column_if_missing(table: str, ddl: str, column: str) -> None:
        if not table_exists(table):
            return
        existing = {col["name"] for col in inspector.get_columns(table)}
        if column not in existing:
            with engine.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl}"))
            print(f"Migration: added {table}.{column}")

    # Users: supplier approval flag + store profile fields.
    add_column_if_missing("users", "is_approved BOOLEAN NOT NULL DEFAULT 1", "is_approved")
    add_column_if_missing("users", "company_name VARCHAR", "company_name")
    add_column_if_missing("users", "contact_phone VARCHAR", "contact_phone")
    add_column_if_missing("users", "store_description TEXT", "store_description")
    add_column_if_missing("users", "logo_url VARCHAR", "logo_url")
    # Products: soft-delete flag + review metadata + rich product-form fields.
    add_column_if_missing("products", "is_active BOOLEAN NOT NULL DEFAULT 1", "is_active")
    add_column_if_missing("products", "rejection_reason VARCHAR", "rejection_reason")
    add_column_if_missing("products", "short_description VARCHAR(200)", "short_description")
    add_column_if_missing("products", "unit VARCHAR(20) NOT NULL DEFAULT 'piece'", "unit")
    add_column_if_missing("products", "tags TEXT", "tags")
    add_column_if_missing("products", "image_urls TEXT", "image_urls")
    add_column_if_missing("products", "is_draft BOOLEAN NOT NULL DEFAULT 0", "is_draft")
    add_column_if_missing("products", "updated_at DATETIME", "updated_at")
    # Categories: colour tag for the admin category manager.
    add_column_if_missing("categories", "color_tag VARCHAR", "color_tag")
    # Audit trail table (also created by create_all on fresh databases).
    if not table_exists("audit_logs"):
        Base.metadata.create_all(bind=engine, tables=[models.AuditLog.__table__])
        print("Migration: created audit_logs table")
