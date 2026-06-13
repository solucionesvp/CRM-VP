import uuid
from datetime import datetime
import sqlalchemy as sa
from app.database.session import Base

class ProductService(Base):
    __tablename__ = "product_services"

    id = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Use standard String instead of Enum for flexibility in migrations
    type = sa.Column(sa.String, nullable=False) # 'product' or 'service'
    name = sa.Column(sa.String, nullable=False, unique=True)
    sku = sa.Column(sa.String, nullable=True, unique=True)
    internal_code = sa.Column(sa.String, nullable=True, unique=True)
    brand = sa.Column(sa.String, nullable=True)
    category = sa.Column(sa.String, nullable=True)
    unit = sa.Column(sa.String, nullable=True)
    description = sa.Column(sa.Text, nullable=True)
    area = sa.Column(sa.String, nullable=False) # 'residential', 'commercial', 'industrial', 'other'
    
    is_active = sa.Column(sa.Boolean, default=True, nullable=False)
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = sa.Column(
        sa.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        sa.Index("idx_product_services_type", "type"),
        sa.Index("idx_product_services_area", "area"),
        sa.Index("idx_product_services_is_active", "is_active"),
    )
