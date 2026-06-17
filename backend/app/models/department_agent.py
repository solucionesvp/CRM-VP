"""
Tabla intermedia Department ↔ User (many-to-many).

`priority` reserva espacio semántico para el futuro:
  0 = agente primario / cualquier agente en round-robin
  1 = agente de respaldo
Sin romper el round-robin actual basta con filtrar priority=0.
"""
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base


class DepartmentAgent(Base):
    __tablename__ = "department_agents"

    department_id = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("departments.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    # 0 = primario, 1 = respaldo — extensible sin cambiar el modelo
    priority = sa.Column(sa.Integer, nullable=False, default=0)

    department = relationship("Department", back_populates="agent_links")
    user       = relationship("User",       back_populates="department_links")
