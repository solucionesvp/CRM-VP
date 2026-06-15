import uuid
from datetime import datetime
import sqlalchemy as sa
from app.database.session import Base


class Department(Base):
    __tablename__ = "departments"

    id          = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = sa.Column(sa.String, nullable=False)
    slug        = sa.Column(sa.String, nullable=False, unique=True)
    color       = sa.Column(sa.String, nullable=True)   # hex, e.g. "#FC6621"
    description = sa.Column(sa.String, nullable=True)
    is_active   = sa.Column(sa.Boolean, nullable=False, default=True)
    created_at  = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = sa.Column(sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
