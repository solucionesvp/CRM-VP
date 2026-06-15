from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


def list_departments(db: Session) -> List[Department]:
    return db.query(Department).filter(Department.is_active == True).order_by(Department.name).all()


def get_department(db: Session, dept_id: UUID) -> Optional[Department]:
    return db.query(Department).filter(Department.id == dept_id).first()


def create_department(db: Session, data: DepartmentCreate) -> Department:
    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


def update_department(db: Session, dept_id: UUID, data: DepartmentUpdate) -> Optional[Department]:
    dept = get_department(db, dept_id)
    if not dept:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
    db.commit()
    db.refresh(dept)
    return dept


def delete_department(db: Session, dept_id: UUID) -> bool:
    dept = get_department(db, dept_id)
    if not dept:
        return False
    dept.is_active = False
    db.commit()
    return True
