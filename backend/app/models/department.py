import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base


class Department(Base):
    __tablename__ = "departments"

    id                   = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name                 = sa.Column(sa.String, nullable=False)
    slug                 = sa.Column(sa.String, nullable=False, unique=True)
    color                = sa.Column(sa.String, nullable=True)   # hex, e.g. "#FC6621"
    description          = sa.Column(sa.String, nullable=True)
    is_active            = sa.Column(sa.Boolean, nullable=False, default=True)
    # Contador atómico para round-robin; se incrementa en cada asignación automática
    last_assigned_index  = sa.Column(sa.Integer, nullable=False, default=0)
    created_at           = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at           = sa.Column(sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Cargado eager para que los agentes siempre estén disponibles en la respuesta
    agent_links = relationship(
        "DepartmentAgent",
        back_populates="department",
        order_by="DepartmentAgent.priority",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
