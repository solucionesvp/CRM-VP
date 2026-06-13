from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import ContactType, OpportunityStatus, TaskType, TaskStatus, ProductServiceType

class SearchProductServiceItem(BaseModel):
    id: UUID
    name: str
    sku: Optional[str] = None
    type: ProductServiceType
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class SearchContactItem(BaseModel):
    id: UUID
    name: str
    company_name: Optional[str] = None
    type: ContactType
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    tags: Optional[List[str]] = []

    model_config = ConfigDict(from_attributes=True)

class SearchOpportunityItem(BaseModel):
    id: UUID
    title: str
    product_interest: str
    status: OpportunityStatus
    contact_id: UUID
    contact_name: str
    contact_company_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class SearchTaskItem(BaseModel):
    id: int
    title: str
    task_type: TaskType
    status: TaskStatus
    due_date: Optional[datetime] = None
    contact_id: Optional[UUID] = None
    contact_name: Optional[str] = None
    opportunity_id: Optional[UUID] = None
    opportunity_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class SearchResultResponse(BaseModel):
    contacts: List[SearchContactItem]
    opportunities: List[SearchOpportunityItem]
    tasks: List[SearchTaskItem]
    product_services: List[SearchProductServiceItem]
