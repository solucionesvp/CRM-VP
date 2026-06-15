"""add_departments

Revision ID: 0009_add_departments
Revises: 0008_whatsapp_bot_base
Create Date: 2026-06-15

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0009_add_departments"
down_revision: Union[str, None] = "0008_whatsapp_bot_base"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id",          sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("name",        sa.String, nullable=False),
        sa.Column("slug",        sa.String, nullable=False),
        sa.Column("color",       sa.String, nullable=True),
        sa.Column("description", sa.String, nullable=True),
        sa.Column("is_active",   sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at",  sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",  sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_departments_slug"),
    )

    # Seed inicial
    op.execute("""
        INSERT INTO departments (id, name, slug, color, description, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Ventas',            'sales',   '#FC6621', 'Venta de equipos y cotizaciones',    true, now(), now()),
        (gen_random_uuid(), 'Taller y servicio', 'service', '#3B82F6', 'Reparación y mantenimiento técnico', true, now(), now()),
        (gen_random_uuid(), 'Refacciones',       'parts',   '#10B981', 'Venta de refacciones y piezas',      true, now(), now()),
        (gen_random_uuid(), 'Atención a cliente','support', '#8B5CF6', 'Soporte general y consultas',        true, now(), now())
    """)


def downgrade() -> None:
    op.drop_table("departments")
