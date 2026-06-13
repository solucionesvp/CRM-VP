from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import ContactType, ContactSource, TaskType

class ContactBase(BaseModel):
    type: ContactType
    name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    source: Optional[ContactSource] = None
    address: Optional[str] = None
    city: Optional[str] = "Tepic"
    tags: Optional[List[str]] = []
    notes: Optional[str] = None

class ContactCreate(ContactBase):
    assigned_to: Optional[UUID] = None
    created_by: Optional[UUID] = None

class ContactUpdate(BaseModel):
    type: Optional[ContactType] = None
    name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    source: Optional[ContactSource] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    assigned_to: Optional[UUID] = None

class ContactNextTaskSchema(BaseModel):
    id: int
    title: str
    task_type: TaskType
    due_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ContactResponse(ContactBase):
    id: UUID
    is_active: bool
    assigned_to: Optional[UUID]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    opportunities_count: int = 0
    has_open_opportunities: bool = False
    primary_interest: Optional[str] = None
    next_task: Optional[ContactNextTaskSchema] = None

    model_config = ConfigDict(from_attributes=True)


class ContactListResponse(BaseModel):
    items: List[ContactResponse]
    total: int
    page: int
    size: int


class ContactActivityResponse(BaseModel):
    id: UUID
    opportunity_id: UUID
    opportunity_title: Optional[str] = None
    action_type: str
    description: Optional[str] = None
    from_stage_name: Optional[str] = None
    to_stage_name: Optional[str] = None
    is_system: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
