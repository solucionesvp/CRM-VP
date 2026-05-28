"""link_stages_to_pipelines

Revision ID: 0003_link_stages_to_pipelines
Revises: 0002_add_pipelines
Create Date: 2026-05-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0003_link_stages_to_pipelines'
down_revision: Union[str, None] = '0002_add_pipelines'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# -----------------------------------------------------------------------
# Seed data — stages grouped by pipeline
# -----------------------------------------------------------------------
PIPELINE_STAGES = {
    1: [  # Venta de equipo (sales)
        (1, 'Nuevo interés',       'new',       '#6B7280', False, False),
        (2, 'Contactado',          'contacted', '#3B82F6', False, False),
        (3, 'Interesado',          'interested','#8B5CF6', False, False),
        (4, 'Cotización enviada',  'quote_sent','#F59E0B', False, False),
        (5, 'Seguimiento',         'follow_up', '#EC4899', False, False),
        (6, 'Cerrado ganado',      'won',       '#10B981', True,  False),
        (7, 'Cerrado perdido',     'lost',      '#EF4444', False, True),
    ],
    2: [  # Taller / servicio técnico (service)
        (1, 'Recibido',            'received',  '#6B7280', False, False),
        (2, 'Diagnóstico',         'diagnosis', '#3B82F6', False, False),
        (3, 'En reparación',       'in_repair', '#8B5CF6', False, False),
        (4, 'Listo para entrega',  'ready',     '#F59E0B', False, False),
        (5, 'Entregado',           'delivered', '#10B981', True,  False),
        (6, 'Cancelado',           'cancelled', '#EF4444', False, True),
    ],
    3: [  # Refacciones (parts)
        (1, 'Solicitud',              'request',   '#6B7280', False, False),
        (2, 'Validando existencia',   'validating','#3B82F6', False, False),
        (3, 'Pedido realizado',       'ordered',   '#8B5CF6', False, False),
        (4, 'En camino',              'shipped',   '#F59E0B', False, False),
        (5, 'Entregado',              'delivered', '#10B981', True,  False),
        (6, 'Cancelado',              'cancelled', '#EF4444', False, True),
    ],
}

ORIGINAL_STAGES = [
    (1, 'Nuevo interés',       'new',         '#6B7280', False, False),
    (2, 'Contactado',          'contacted',   '#3B82F6', False, False),
    (3, 'Interesado',          'interested',  '#8B5CF6', False, False),
    (4, 'Cotización enviada',  'quote_sent',  '#F59E0B', False, False),
    (5, 'Seguimiento',         'follow_up',   '#EC4899', False, False),
    (6, 'Ganado',              'won',         '#10B981', True,  False),
    (7, 'Perdido',             'lost',        '#EF4444', False, True),
]


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Add pipeline_id as nullable first
    # ------------------------------------------------------------------
    op.add_column(
        'opportunity_stages',
        sa.Column('pipeline_id', sa.Integer,
                  sa.ForeignKey('pipelines.id', ondelete='RESTRICT'),
                  nullable=True)
    )

    # ------------------------------------------------------------------
    # 2. Drop the global unique constraint on slug so we can have
    #    the same slug across different pipelines (e.g. 'delivered')
    # ------------------------------------------------------------------
    op.drop_constraint('opportunity_stages_slug_key', 'opportunity_stages', type_='unique')

    # ------------------------------------------------------------------
    # 3. Temporarily drop the FK from opportunities.stage_id so we can
    #    delete the old stages without a FK violation
    # ------------------------------------------------------------------
    op.drop_constraint('opportunities_stage_id_fkey', 'opportunities', type_='foreignkey')

    # ------------------------------------------------------------------
    # 4. Delete all existing global stages (FK is gone, safe now)
    # ------------------------------------------------------------------
    op.execute("DELETE FROM opportunity_stages")

    # ------------------------------------------------------------------
    # 5. Insert per-pipeline stages
    # ------------------------------------------------------------------
    for pipeline_id, stages in PIPELINE_STAGES.items():
        for order, name, slug, color, is_won, is_lost in stages:
            op.execute(
                sa.text(
                    "INSERT INTO opportunity_stages "
                    "(name, slug, \"order\", color, is_won, is_lost, is_active, pipeline_id) "
                    "VALUES (:name, :slug, :order, :color, :is_won, :is_lost, true, :pipeline_id)"
                ).bindparams(
                    name=name, slug=slug, order=order,
                    color=color, is_won=is_won, is_lost=is_lost,
                    pipeline_id=pipeline_id,
                )
            )

    # ------------------------------------------------------------------
    # 6. Make pipeline_id NOT NULL now all rows are populated
    # ------------------------------------------------------------------
    op.alter_column('opportunity_stages', 'pipeline_id', nullable=False)

    # ------------------------------------------------------------------
    # 7. Add composite unique: slug is unique PER pipeline
    # ------------------------------------------------------------------
    op.create_unique_constraint(
        'uq_opportunity_stages_pipeline_slug',
        'opportunity_stages',
        ['pipeline_id', 'slug']
    )

    # ------------------------------------------------------------------
    # 8. Create index for fast lookups by pipeline
    # ------------------------------------------------------------------
    op.create_index(
        'idx_opportunity_stages_pipeline_id',
        'opportunity_stages',
        ['pipeline_id']
    )

    # ------------------------------------------------------------------
    # 9. Reassign opportunity stage_ids to first stage of their pipeline,
    #    then restore the FK constraint
    # ------------------------------------------------------------------
    op.execute("""
        UPDATE opportunities o
        SET stage_id = (
            SELECT s.id
            FROM opportunity_stages s
            WHERE s.pipeline_id = o.pipeline_id
            ORDER BY s."order"
            LIMIT 1
        )
    """)

    op.create_foreign_key(
        'opportunities_stage_id_fkey',
        'opportunities', 'opportunity_stages',
        ['stage_id'], ['id'],
        ondelete='RESTRICT',
    )


def downgrade() -> None:
    # Remove composite unique and index
    op.drop_constraint('uq_opportunity_stages_pipeline_slug', 'opportunity_stages', type_='unique')
    op.drop_index('idx_opportunity_stages_pipeline_id', table_name='opportunity_stages')

    # Remove pipeline_id column from stages
    op.drop_column('opportunity_stages', 'pipeline_id')

    # Drop the FK so we can clear the stage rows
    op.drop_constraint('opportunities_stage_id_fkey', 'opportunities', type_='foreignkey')

    # Delete per-pipeline stages
    op.execute("DELETE FROM opportunity_stages")

    # Restore original 7 global stages
    for order, name, slug, color, is_won, is_lost in ORIGINAL_STAGES:
        op.execute(
            sa.text(
                "INSERT INTO opportunity_stages "
                "(name, slug, \"order\", color, is_won, is_lost, is_active) "
                "VALUES (:name, :slug, :order, :color, :is_won, :is_lost, true)"
            ).bindparams(
                name=name, slug=slug, order=order,
                color=color, is_won=is_won, is_lost=is_lost,
            )
        )

    # Restore the original global unique constraint on slug
    op.create_unique_constraint(
        'opportunity_stages_slug_key',
        'opportunity_stages',
        ['slug']
    )

    # Reset all opportunity stage_ids to stage 1 (best-effort on downgrade)
    op.execute("""
        UPDATE opportunities
        SET stage_id = (SELECT id FROM opportunity_stages ORDER BY "order" LIMIT 1)
    """)

    # Restore the FK
    op.create_foreign_key(
        'opportunities_stage_id_fkey',
        'opportunities', 'opportunity_stages',
        ['stage_id'], ['id'],
        ondelete='RESTRICT',
    )
