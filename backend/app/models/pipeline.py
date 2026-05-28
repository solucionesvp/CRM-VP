from datetime import datetime
import sqlalchemy as sa
from app.database.session import Base


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.String, unique=True, nullable=False)
    slug = sa.Column(sa.String, unique=True, nullable=False)
    description = sa.Column(sa.String, nullable=True)
    is_active = sa.Column(sa.Boolean, default=True, nullable=False)
    order = sa.Column(sa.Integer, default=0, nullable=False)
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = sa.Column(
        sa.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
