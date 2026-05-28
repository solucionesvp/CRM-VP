from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.models.enums import OpportunityPriority, OpportunityStatus, ActivityActionType
from app.schemas.stage import StageResponse


class PipelineCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    order: int = 0


class PipelineUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class PipelineResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    order: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OpportunityBase(BaseModel):
    contact_id: UUID
    title: str
    product_interest: str
    stage_id: int
    pipeline_id: int
    assigned_to: Optional[UUID] = None
    expected_value: Optional[Decimal] = None
    currency: str = "MXN"
    expected_close_date: Optional[datetime] = None
    priority: OpportunityPriority = OpportunityPriority.medium
    source: Optional[str] = None


class OpportunityCreate(OpportunityBase):
    created_by: Optional[UUID] = None


class OpportunityUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    title: Optional[str] = None
    product_interest: Optional[str] = None
    stage_id: Optional[int] = None
    pipeline_id: Optional[int] = None
    assigned_to: Optional[UUID] = None
    expected_value: Optional[Decimal] = None
    currency: Optional[str] = None
    expected_close_date: Optional[datetime] = None
    priority: Optional[OpportunityPriority] = None
    source: Optional[str] = None
    lost_reason: Optional[str] = None


class OpportunityStageChange(BaseModel):
    stage_id: int
    description: Optional[str] = None


class NoteCreate(BaseModel):
    content: str


class OpportunityResponse(OpportunityBase):
    id: UUID
    status: OpportunityStatus
    won_at: Optional[datetime] = None
    lost_at: Optional[datetime] = None
    lost_reason: Optional[str] = None
    stage: StageResponse
    pipeline: Optional[PipelineResponse] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OpportunityListResponse(BaseModel):
    items: List[OpportunityResponse]
    total: int
    page: int
    size: int


class NoteResponse(BaseModel):
    id: UUID
    opportunity_id: UUID
    user_id: Optional[UUID] = None
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityResponse(BaseModel):
    id: UUID
    opportunity_id: UUID
    user_id: Optional[UUID] = None
    action_type: ActivityActionType
    from_stage_id: Optional[int] = None
    to_stage_id: Optional[int] = None
    description: Optional[str] = None
    is_system: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
