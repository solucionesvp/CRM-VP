"""add_missing_product_service_fields

Revision ID: 0006_product_fields
Revises: 0005_add_product_services
Create Date: 2026-06-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0006_product_fields'
down_revision: Union[str, None] = '0005_add_product_services'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add columns to product_services table
    op.add_column('product_services', sa.Column('internal_code', sa.String(), nullable=True))
    op.add_column('product_services', sa.Column('brand', sa.String(), nullable=True))
    op.add_column('product_services', sa.Column('category', sa.String(), nullable=True))
    op.add_column('product_services', sa.Column('unit', sa.String(), nullable=True))
    
    # Add unique constraint to internal_code
    op.create_unique_constraint('uq_product_services_internal_code', 'product_services', ['internal_code'])


def downgrade() -> None:
    # Drop unique constraint
    op.drop_constraint('uq_product_services_internal_code', 'product_services', type_='unique')
    
    # Drop columns
    op.drop_column('product_services', 'unit')
    op.drop_column('product_services', 'category')
    op.drop_column('product_services', 'brand')
    op.drop_column('product_services', 'internal_code')
