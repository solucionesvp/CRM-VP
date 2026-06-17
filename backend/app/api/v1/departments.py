from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.services import department_service, department_agent_service

router = APIRouter(prefix="/departments", tags=["departments"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _resp(dept) -> DepartmentResponse:
    return DepartmentResponse.from_dept(dept)

def _get_or_404(db: Session, dept_id: UUID):
    dept = department_service.get_department(db, dept_id)
    if not dept:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Departamento no encontrado")
    return dept


# ── Departamentos ──────────────────────────────────────────────────────────────

@router.get("/", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return [_resp(d) for d in department_service.list_departments(db)]


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    return _resp(department_service.create_department(db, data))


@router.patch("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: UUID, data: DepartmentUpdate, db: Session = Depends(get_db)):
    dept = department_service.update_department(db, dept_id, data)
    if not dept:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Departamento no encontrado")
    return _resp(dept)


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(dept_id: UUID, db: Session = Depends(get_db)):
    if not department_service.delete_department(db, dept_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Departamento no encontrado")


# ── Agentes ────────────────────────────────────────────────────────────────────

@router.post("/{dept_id}/agents/{user_id}", response_model=DepartmentResponse)
def add_agent(dept_id: UUID, user_id: UUID, priority: int = 0, db: Session = Depends(get_db)):
    """Agrega (o actualiza) un agente en un departamento."""
    dept = _get_or_404(db, dept_id)
    if not db.get(User, user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    department_agent_service.add_agent(db, dept_id, user_id, priority)
    db.refresh(dept)
    return _resp(dept)


@router.delete("/{dept_id}/agents/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_agent(dept_id: UUID, user_id: UUID, db: Session = Depends(get_db)):
    """Quita un agente del departamento."""
    _get_or_404(db, dept_id)
    if not department_agent_service.remove_agent(db, dept_id, user_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agente no pertenece a este departamento")


# ── Asignación automática (round-robin) ────────────────────────────────────────

@router.post("/{dept_id}/assign-conversation/{conv_id}")
def assign_conversation_auto(dept_id: UUID, conv_id: UUID, db: Session = Depends(get_db)):
    """
    Asigna la conversación al siguiente agente del departamento en round-robin.
    Cada llamada rota al siguiente agente disponible.
    """
    dept = _get_or_404(db, dept_id)
    conv = department_agent_service.auto_assign_conversation(db, conv_id, dept.slug)
    if conv is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No hay agentes activos en este departamento o conversación no encontrada",
        )
    return {"conversation_id": str(conv.id), "assigned_to_user_id": str(conv.assigned_to_user_id)}
