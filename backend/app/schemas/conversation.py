from uuid import UUID
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class ContactBrief(BaseModel):
    id: UUID
    name: str
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class OpportunityBrief(BaseModel):
    id: UUID
    title: str
    pipeline_id: int
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: UUID
    direction: str
    sender_type: str
    message_type: str
    content: Optional[str] = None
    external_id: Optional[str] = None
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ConversationListItem(BaseModel):
    id: UUID
    status: str
    bot_active: bool
    channel_identifier: str
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    unread_count: int
    assigned_department: Optional[str] = None
    assigned_to_user_id: Optional[UUID] = None
    created_at: datetime
    contact: Optional[ContactBrief] = None
    opportunity: Optional[OpportunityBrief] = None
    last_message: Optional[MessageResponse] = None
    model_config = ConfigDict(from_attributes=True)


class ConversationDetail(BaseModel):
    id: UUID
    status: str
    bot_active: bool
    channel_identifier: str
    last_message_at: Optional[datetime] = None
    last_message_preview: Optional[str] = None
    unread_count: int
    assigned_department: Optional[str] = None
    assigned_to_user_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    contact: Optional[ContactBrief] = None
    opportunity: Optional[OpportunityBrief] = None
    model_config = ConfigDict(from_attributes=True)


class ConversationUpdate(BaseModel):
    status: Optional[str] = None
    bot_active: Optional[bool] = None
    assigned_department: Optional[str] = None
    assigned_to_user_id: Optional[UUID] = None
    opportunity_id: Optional[UUID] = None
    reset_handoff: Optional[bool] = None


class ConversationAssign(BaseModel):
    department: Optional[str] = None
    user_id: Optional[UUID] = None


class SendMessageRequest(BaseModel):
    text: str


class CreateOpportunityRequest(BaseModel):
    pipeline_id: int
    title: str
    product_interest: str
