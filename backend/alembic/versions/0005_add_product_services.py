"""add_product_services

Revision ID: 0005_add_product_services
Revises: 0004_add_tasks
Create Date: 2026-06-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0005_add_product_services'
down_revision: Union[str, None] = '0004_add_tasks'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create product_services table
    op.create_table(
        'product_services',
        sa.Column('id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('sku', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('area', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
        sa.UniqueConstraint('sku')
    )

    # Create indices
    op.create_index('idx_product_services_type', 'product_services', ['type'])
    op.create_index('idx_product_services_area', 'product_services', ['area'])
    op.create_index('idx_product_services_is_active', 'product_services', ['is_active'])

    # Add product_service_id to opportunities
    op.add_column('opportunities', sa.Column('product_service_id', sa.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_opportunities_product_service_id', 'opportunities', 'product_services', ['product_service_id'], ['id'], ondelete='SET NULL')

    # Insert Seed Data
    op.execute("""
        INSERT INTO product_services (id, type, name, sku, description, area, is_active, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), 'product', 'Cámara de Seguridad IP', 'CAM-IP-001', 'Cámara de seguridad IP 1080p con visión nocturna.', 'residential', true, now(), now()),
            (gen_random_uuid(), 'product', 'Panel de Alarma Inteligente', 'ALRM-PNL-002', 'Panel central de alarma con conectividad WiFi y celular.', 'commercial', true, now(), now()),
            (gen_random_uuid(), 'service', 'Instalación de CCTV (Básico)', 'SRV-CCTV-01', 'Instalación de hasta 4 cámaras con cableado básico.', 'residential', true, now(), now()),
            (gen_random_uuid(), 'service', 'Mantenimiento Preventivo (Industrial)', 'SRV-MNT-IND', 'Mantenimiento mensual para sistemas de seguridad industriales.', 'industrial', true, now(), now()),
            (gen_random_uuid(), 'product', 'Sensor de Movimiento PIR', 'SNR-PIR-05', 'Sensor de movimiento infrarrojo pasivo para interiores.', 'residential', true, now(), now())
    """)


def downgrade() -> None:
    # Drop foreign key and column from opportunities
    op.drop_constraint('fk_opportunities_product_service_id', 'opportunities', type_='foreignkey')
    op.drop_column('opportunities', 'product_service_id')

    # Drop indices
    op.drop_index('idx_product_services_is_active', table_name='product_services')
    op.drop_index('idx_product_services_area', table_name='product_services')
    op.drop_index('idx_product_services_type', table_name='product_services')

    # Drop product_services table
    op.drop_table('product_services')
