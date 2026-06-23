"""add_opportunity_attachments

Revision ID: 0013_add_opportunity_attachments
Revises: 0012_add_tags
Create Date: 2026-06-23

Crea la tabla `opportunity_attachments` para adjuntos en oportunidades.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0013_add_opportunity_attachments"
down_revision: Union[str, None] = "0012_add_tags"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "opportunity_attachments",
        sa.Column("id",             sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("opportunity_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("filename",       sa.String,  nullable=False),
        sa.Column("file_key",       sa.String,  nullable=False),
        sa.Column("file_url",       sa.String,  nullable=False),
        sa.Column("content_type",   sa.String,  nullable=False),
        sa.Column("file_size",      sa.Integer, nullable=True),
        sa.Column("uploaded_by",    sa.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at",     sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["opportunity_id"], ["opportunities.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["uploaded_by"], ["users.id"], ondelete="SET NULL"
        ),
    )
    op.create_index(
        "idx_opp_attachments_opportunity_id",
        "opportunity_attachments",
        ["opportunity_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_opp_attachments_opportunity_id", table_name="opportunity_attachments")
    op.drop_table("opportunity_attachments")
