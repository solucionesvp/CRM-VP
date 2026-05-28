from datetime import datetime, timezone, time
from uuid import UUID
from typing import Optional
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.opportunity_activity import OpportunityActivity
from app.models.enums import TaskStatus, TaskPriority, TaskType, ActivityActionType
from app.schemas.task import TaskCreate, TaskUpdate

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)

class TaskService:
    @staticmethod
    def get_tasks(db: Session, filters: dict) -> list[Task]:
        query = db.query(Task)
        
        status = filters.get("status")
        if status:
            if status == "overdue":
                query = query.filter(
                    Task.status == TaskStatus.pending,
                    Task.due_date < _utcnow()
                )
            else:
                query = query.filter(Task.status == TaskStatus(status))
                
        priority = filters.get("priority")
        if priority:
            query = query.filter(Task.priority == TaskPriority(priority))
            
        task_type = filters.get("task_type")
        if task_type:
            query = query.filter(Task.task_type == TaskType(task_type))
            
        contact_id = filters.get("contact_id")
        if contact_id:
            query = query.filter(Task.contact_id == contact_id)
            
        opportunity_id = filters.get("opportunity_id")
        if opportunity_id:
            query = query.filter(Task.opportunity_id == opportunity_id)
            
        due_today = filters.get("due_today")
        if due_today:
            today_start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
            today_end = datetime.combine(datetime.now(timezone.utc).date(), time.max, tzinfo=timezone.utc)
            query = query.filter(Task.due_date >= today_start, Task.due_date <= today_end)

        # Order by: due_date ASC nulls last, priority DESC, created_at DESC
        query = query.order_by(
            Task.due_date.asc().nulls_last(),
            Task.priority.desc(),
            Task.created_at.desc()
        )
        return query.all()

    @staticmethod
    def get_task(db: Session, task_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def create_task(db: Session, data: TaskCreate) -> Task:
        task = Task(**data.model_dump())
        db.add(task)
        db.flush()
        
        if task.opportunity_id:
            activity = OpportunityActivity(
                opportunity_id=task.opportunity_id,
                action_type=ActivityActionType.follow_up,
                description=f"Tarea creada: {task.title}",
                is_system=True
            )
            db.add(activity)
            
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update_task(db: Session, task_id: int, data: TaskUpdate) -> Optional[Task]:
        task = TaskService.get_task(db, task_id)
        if not task:
            return None
        
        updates = data.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(task, field, value)
            
        task.updated_at = _utcnow()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def complete_task(db: Session, task_id: int) -> Optional[Task]:
        task = TaskService.get_task(db, task_id)
        if not task:
            return None
            
        task.status = TaskStatus.completed
        task.completed_at = _utcnow()
        task.updated_at = _utcnow()
        
        if task.opportunity_id:
            activity = OpportunityActivity(
                opportunity_id=task.opportunity_id,
                action_type=ActivityActionType.follow_up,
                description=f"Tarea completada: {task.title}",
                is_system=True
            )
            db.add(activity)
            
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(db: Session, task_id: int) -> bool:
        task = TaskService.get_task(db, task_id)
        if not task:
            return False
            
        db.delete(task)
        db.commit()
        return True

    @staticmethod
    def get_tasks_by_contact(db: Session, contact_id: UUID) -> list[Task]:
        return TaskService.get_tasks(db, {"contact_id": contact_id})

    @staticmethod
    def get_tasks_by_opportunity(db: Session, opportunity_id: UUID) -> list[Task]:
        return TaskService.get_tasks(db, {"opportunity_id": opportunity_id})
