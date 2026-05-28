"""add_tasks

Revision ID: 0004_add_tasks
Revises: 0003_link_stages_to_pipelines
Create Date: 2026-05-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0004_add_tasks'
down_revision: Union[str, None] = '0003_link_stages_to_pipelines'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Drop existing enum types if they exist to prevent duplication conflicts
    op.execute("DROP TYPE IF EXISTS tasktype CASCADE")
    op.execute("DROP TYPE IF EXISTS taskstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS taskpriority CASCADE")

    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('contact_id', sa.UUID(as_uuid=True), nullable=True),
        sa.Column('opportunity_id', sa.UUID(as_uuid=True), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column(
            'task_type',
            sa.Enum('call', 'whatsapp', 'quote_follow_up', 'visit', 'diagnosis', 'payment', 'delivery', 'general', name='tasktype'),
            server_default='general',
            nullable=False
        ),
        sa.Column(
            'status',
            sa.Enum('pending', 'completed', 'cancelled', name='taskstatus'),
            server_default='pending',
            nullable=False
        ),
        sa.Column(
            'priority',
            sa.Enum('low', 'medium', 'high', 'urgent', name='taskpriority'),
            server_default='medium',
            nullable=False
        ),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['opportunity_id'], ['opportunities.id'], ondelete='SET NULL')
    )

    # Create indices
    op.create_index('idx_tasks_contact_id', 'tasks', ['contact_id'])
    op.create_index('idx_tasks_opportunity_id', 'tasks', ['opportunity_id'])
    op.create_index('idx_tasks_status', 'tasks', ['status'])

def downgrade() -> None:
    # Drop indices
    op.drop_index('idx_tasks_status', table_name='tasks')
    op.drop_index('idx_tasks_opportunity_id', table_name='tasks')
    op.drop_index('idx_tasks_contact_id', table_name='tasks')

    # Drop tasks table
    op.drop_table('tasks')

    # Drop custom PostgreSQL Enum types
    op.execute("DROP TYPE IF EXISTS taskpriority CASCADE")
    op.execute("DROP TYPE IF EXISTS taskstatus CASCADE")
    op.execute("DROP TYPE IF EXISTS tasktype CASCADE")
