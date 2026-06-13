"""add_commercial_engine

Revision ID: 0007_comm_engine
Revises: 0006_product_fields
Create Date: 2026-06-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0007_comm_engine'
down_revision: Union[str, None] = '0006_product_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop existing enum types if they exist to prevent duplication conflicts
    op.execute("DROP TYPE IF EXISTS quickreplycategory CASCADE")
    op.execute("DROP TYPE IF EXISTS ruletriggerevent CASCADE")
    op.execute("DROP TYPE IF EXISTS ruleactiontype CASCADE")

    # 2. Create Postgres Enum Types explicitly
    # Use postgresql.ENUM explicitly
    postgresql.ENUM('primer_contacto', 'seguimiento', 'cotizacion', 'diagnostico', 'entrega', 'general', name='quickreplycategory').create(op.get_bind())
    postgresql.ENUM('on_enter', name='ruletriggerevent').create(op.get_bind())
    postgresql.ENUM('create_task', 'suggest_reply', 'notify', name='ruleactiontype').create(op.get_bind())

    # 3. Create quick_replies table
    op.create_table(
        'quick_replies',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column(
            'category',
            postgresql.ENUM('primer_contacto', 'seguimiento', 'cotizacion', 'diagnostico', 'entrega', 'general', name='quickreplycategory', create_type=False),
            server_default='general',
            nullable=False
        ),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tags', sa.String(length=300), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.PrimaryKeyConstraint('id')
    )

    # 4. Create stage_rules table
    op.create_table(
        'stage_rules',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('pipeline_id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=False),
        sa.Column(
            'trigger_event',
            postgresql.ENUM('on_enter', name='ruletriggerevent', create_type=False),
            server_default='on_enter',
            nullable=False
        ),
        sa.Column(
            'action_type',
            postgresql.ENUM('create_task', 'suggest_reply', 'notify', name='ruleactiontype', create_type=False),
            nullable=False
        ),
        sa.Column(
            'task_type',
            postgresql.ENUM('call', 'whatsapp', 'quote_follow_up', 'visit', 'diagnosis', 'payment', 'delivery', 'general', name='tasktype', create_type=False),
            nullable=True
        ),
        sa.Column('task_title_template', sa.String(length=255), nullable=True),
        sa.Column('quick_reply_id', sa.Integer(), nullable=True),
        sa.Column(
            'priority',
            postgresql.ENUM('low', 'medium', 'high', 'urgent', name='taskpriority', create_type=False),
            server_default='medium',
            nullable=False
        ),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['pipeline_id'], ['pipelines.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['stage_id'], ['opportunity_stages.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['quick_reply_id'], ['quick_replies.id'], ondelete='SET NULL')
    )

    # 5. Create Indices for foreign keys
    op.create_index('idx_stage_rules_pipeline_id', 'stage_rules', ['pipeline_id'])
    op.create_index('idx_stage_rules_stage_id', 'stage_rules', ['stage_id'])


def downgrade() -> None:
    # Drop indices
    op.drop_index('idx_stage_rules_stage_id', table_name='stage_rules')
    op.drop_index('idx_stage_rules_pipeline_id', table_name='stage_rules')

    # Drop tables
    op.drop_table('stage_rules')
    op.drop_table('quick_replies')

    # Drop custom PostgreSQL Enum types
    op.execute("DROP TYPE IF EXISTS ruleactiontype CASCADE")
    op.execute("DROP TYPE IF EXISTS ruletriggerevent CASCADE")
    op.execute("DROP TYPE IF EXISTS quickreplycategory CASCADE")
