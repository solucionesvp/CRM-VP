from pydantic import BaseModel, ConfigDict, model_validator, computed_field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.enums import TaskType, TaskPriority, TaskStatus

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: TaskType = TaskType.general
    priority: TaskPriority = TaskPriority.medium
    due_date: Optional[datetime] = None
    contact_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None

    @model_validator(mode="after")
    def validate_ids(self) -> "TaskBase":
        if self.contact_id is None and self.opportunity_id is None:
            raise ValueError("Debe proporcionarse al menos contact_id o opportunity_id")
        return self

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    task_type: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    contact_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None
    status: Optional[TaskStatus] = None

class TaskResponse(TaskBase):
    id: int
    status: TaskStatus
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def is_overdue(self) -> bool:
        if self.status == TaskStatus.pending and self.due_date is not None:
            now = datetime.now(self.due_date.tzinfo) if self.due_date.tzinfo else datetime.now()
            return self.due_date < now
        return False

    model_config = ConfigDict(from_attributes=True)
