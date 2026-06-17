"""add_department_agents

Revision ID: 0010_department_agents
Revises: 0009_add_departments
Create Date: 2026-06-16

Añade:
  - Tabla `department_agents` (many-to-many Department ↔ User con priority)
  - Columna `departments.last_assigned_index` (contador round-robin)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0010_department_agents"
down_revision: Union[str, None] = "0009_add_departments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Contador para round-robin por departamento
    op.add_column(
        "departments",
        sa.Column("last_assigned_index", sa.Integer, nullable=False, server_default="0"),
    )

    # Tabla intermedia Department ↔ User
    op.create_table(
        "department_agents",
        sa.Column(
            "department_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("departments.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "user_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        # 0=primario, 1=respaldo — extensible sin rehacer el modelo
        sa.Column("priority", sa.Integer, nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("department_agents")
    op.drop_column("departments", "last_assigned_index")
