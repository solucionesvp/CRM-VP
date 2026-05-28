from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import ContactType, ContactSource

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

class ContactResponse(ContactBase):
    id: UUID
    is_active: bool
    assigned_to: Optional[UUID]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ContactListResponse(BaseModel):
    items: List[ContactResponse]
    total: int
    page: int
    size: int
