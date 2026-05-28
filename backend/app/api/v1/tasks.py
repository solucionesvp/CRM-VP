from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List

from app.database.session import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse
from app.services.task_service import TaskService

router = APIRouter(tags=["tasks"])

@router.get("/tasks/", response_model=List[TaskResponse])
def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    task_type: Optional[str] = None,
    contact_id: Optional[UUID] = None,
    opportunity_id: Optional[UUID] = None,
    due_today: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    filters = {
        "status": status,
        "priority": priority,
        "task_type": task_type,
        "contact_id": contact_id,
        "opportunity_id": opportunity_id,
        "due_today": due_today
    }
    return TaskService.get_tasks(db, filters)

@router.post("/tasks/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    try:
        return TaskService.create_task(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = TaskService.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return task

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db: Session = Depends(get_db)):
    task = TaskService.update_task(db, task_id, data)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    success = TaskService.delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.patch("/tasks/{task_id}/complete", response_model=TaskResponse)
def complete_task(task_id: int, db: Session = Depends(get_db)):
    task = TaskService.complete_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return task

@router.get("/contacts/{contact_id}/tasks", response_model=List[TaskResponse])
def get_tasks_by_contact(contact_id: UUID, db: Session = Depends(get_db)):
    return TaskService.get_tasks_by_contact(db, contact_id)

@router.get("/opportunities/{opportunity_id}/tasks", response_model=List[TaskResponse])
def get_tasks_by_opportunity(opportunity_id: UUID, db: Session = Depends(get_db)):
    return TaskService.get_tasks_by_opportunity(db, opportunity_id)
