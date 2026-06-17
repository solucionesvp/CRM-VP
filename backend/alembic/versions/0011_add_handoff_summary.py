"""add_handoff_summary

Revision ID: 0011_add_handoff_summary
Revises: 0010_department_agents
Create Date: 2026-06-16

Agrega `handoff_summary` a conversation_contexts: resumen legible
para el agente humano al que se transfiere la conversación.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0011_add_handoff_summary"
down_revision: Union[str, None] = "0010_department_agents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "conversation_contexts",
        sa.Column("handoff_summary", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("conversation_contexts", "handoff_summary")
