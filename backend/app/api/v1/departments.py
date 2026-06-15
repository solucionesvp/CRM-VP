from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.services import department_service

router = APIRouter(prefix="/departments", tags=["departments"])


@router.get("/", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return department_service.list_departments(db)


@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    return department_service.create_department(db, data)


@router.patch("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: UUID, data: DepartmentUpdate, db: Session = Depends(get_db)):
    dept = department_service.update_department(db, dept_id, data)
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Departamento no encontrado")
    return dept


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(dept_id: UUID, db: Session = Depends(get_db)):
    if not department_service.delete_department(db, dept_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Departamento no encontrado")
