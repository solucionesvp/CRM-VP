"""add_pipelines_and_pipeline_id_to_opportunities

Revision ID: 0002_add_pipelines
Revises: b11588760557
Create Date: 2026-05-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002_add_pipelines'
down_revision: Union[str, None] = 'b11588760557'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create pipelines table
    op.create_table(
        'pipelines',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('name', sa.String, unique=True, nullable=False),
        sa.Column('slug', sa.String, unique=True, nullable=False),
        sa.Column('description', sa.String, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default=sa.text('true')),
        sa.Column('order', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('now()')),
    )

    # 2. Seed 3 base pipelines
    op.execute("""
        INSERT INTO pipelines (name, slug, description, is_active, "order")
        VALUES
            ('Venta de equipo',          'sales',   'Pipeline de venta de equipo Evans',     true, 1),
            ('Taller / servicio técnico','service', 'Pipeline de servicio técnico y taller', true, 2),
            ('Refacciones',              'parts',   'Pipeline de venta de refacciones',      true, 3)
    """)

    # 3. Add pipeline_id as nullable first (needed for backfill on existing rows)
    op.add_column(
        'opportunities',
        sa.Column('pipeline_id', sa.Integer, sa.ForeignKey('pipelines.id', ondelete='RESTRICT'), nullable=True)
    )
    op.create_index('idx_opportunities_pipeline_id', 'opportunities', ['pipeline_id'])

    # 4. Backfill: assign all existing opportunities to pipeline 1 (sales)
    op.execute("UPDATE opportunities SET pipeline_id = 1")

    # 5. Make pipeline_id NOT NULL now that all rows are populated
    op.alter_column('opportunities', 'pipeline_id', nullable=False)


def downgrade() -> None:
    # Remove pipeline_id from opportunities
    op.drop_index('idx_opportunities_pipeline_id', table_name='opportunities')
    op.drop_column('opportunities', 'pipeline_id')

    # Drop pipelines table
    op.drop_table('pipelines')
