"""add_tags

Revision ID: 0012_add_tags
Revises: 0011_add_handoff_summary
Create Date: 2026-06-20

Crea tablas `tags` y `contact_tags` para el sistema de etiquetas del CRM.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0012_add_tags"
down_revision: Union[str, None] = "0011_add_handoff_summary"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tags",
        sa.Column("id",          sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("name",        sa.String,     nullable=False),
        sa.Column("label",       sa.String,     nullable=False),
        sa.Column("color",       sa.String(7),  nullable=False),
        sa.Column("description", sa.Text,       nullable=True),
        sa.Column("is_active",   sa.Boolean,    nullable=False, server_default=sa.text("true")),
        sa.Column("created_at",  sa.DateTime,   nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",  sa.DateTime,   nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name",  name="uq_tags_name"),
        sa.UniqueConstraint("color", name="uq_tags_color"),
    )

    op.create_table(
        "contact_tags",
        sa.Column("contact_id",   sa.UUID(as_uuid=True), nullable=False),
        sa.Column("tag_id",       sa.UUID(as_uuid=True), nullable=False),
        sa.Column("assigned_by",  sa.String,   nullable=True),
        sa.Column("created_at",   sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("contact_id", "tag_id"),
        sa.ForeignKeyConstraint(["contact_id"], ["contacts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"],     ["tags.id"],     ondelete="CASCADE"),
    )


def downgrade() -> None:
    op.drop_table("contact_tags")
    op.drop_table("tags")
