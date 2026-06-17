"""
Servicio de membresía y asignación de agentes a departamentos.

Separado de department_service para mantener cada módulo ≤ 100 líneas.
Responsabilidades:
  - CRUD de vínculos Department ↔ User (department_agents)
  - Round-robin: pick_next_agent()
  - Auto-asignación de conversación al siguiente agente del depto
"""
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.department_agent import DepartmentAgent
from app.models.user import User
from app.services import conversation_service


# ── Membresía ──────────────────────────────────────────────────────────────────

def add_agent(
    db: Session, dept_id: UUID, user_id: UUID, priority: int = 0
) -> DepartmentAgent:
    """Agrega un agente al departamento (idempotente: actualiza priority si ya existe)."""
    link = db.get(DepartmentAgent, {"department_id": dept_id, "user_id": user_id})
    if link:
        link.priority = priority
    else:
        link = DepartmentAgent(department_id=dept_id, user_id=user_id, priority=priority)
        db.add(link)
    db.commit()
    db.refresh(link)
    return link


def remove_agent(db: Session, dept_id: UUID, user_id: UUID) -> bool:
    link = db.get(DepartmentAgent, {"department_id": dept_id, "user_id": user_id})
    if not link:
        return False
    db.delete(link)
    db.commit()
    return True


# ── Round-robin ────────────────────────────────────────────────────────────────

def pick_next_agent(db: Session, dept: Department) -> Optional[User]:
    """
    Devuelve el siguiente agente del departamento en orden round-robin.
    Incrementa `last_assigned_index` de forma atómica para que llamadas
    consecutivas roten entre los agentes disponibles.
    Filtrar por priority=0 hoy; en el futuro se puede cambiar a priority-aware.
    """
    links = (
        db.query(DepartmentAgent)
        .filter(DepartmentAgent.department_id == dept.id)
        .order_by(DepartmentAgent.priority, DepartmentAgent.user_id)
        .all()
    )
    if not links:
        return None
    idx = dept.last_assigned_index % len(links)
    dept.last_assigned_index += 1
    db.commit()
    return links[idx].user


# ── Auto-asignación ────────────────────────────────────────────────────────────

def auto_assign_conversation(
    db: Session, conv_id: UUID, dept_slug: str
) -> Optional[object]:
    """
    Asigna la conversación al siguiente agente del departamento (round-robin).
    Retorna la conversación actualizada o None si el depto/conv no existe.
    """
    dept = (
        db.query(Department)
        .filter(Department.slug == dept_slug, Department.is_active.is_(True))
        .first()
    )
    if not dept:
        return None
    agent = pick_next_agent(db, dept)
    if not agent:
        return None
    return conversation_service.assign_conversation(
        db, conv_id, department=dept_slug, user_id=agent.id
    )
