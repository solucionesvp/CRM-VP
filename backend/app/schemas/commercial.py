from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, computed_field, model_validator
from app.models.enums import QuickReplyCategory, RuleTriggerEvent, RuleActionType, TaskType, TaskPriority

# --- QUICK REPLY SCHEMAS ---

class QuickReplyBase(BaseModel):
    name: str = Field(..., max_length=150)
    category: QuickReplyCategory = QuickReplyCategory.general
    content: str
    tags: Optional[str] = Field(None, max_length=300)
    is_active: bool = True

class QuickReplyCreate(QuickReplyBase):
    pass

class QuickReplyUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    category: Optional[QuickReplyCategory] = None
    content: Optional[str] = None
    tags: Optional[str] = Field(None, max_length=300)
    is_active: Optional[bool] = None

class QuickReplyResponse(QuickReplyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    def preview(self) -> str:
        if self.content and len(self.content) > 80:
            return self.content[:80] + "..."
        return self.content or ""


# --- STAGE RULE SCHEMAS ---

class StageRuleBase(BaseModel):
    pipeline_id: int
    stage_id: int
    trigger_event: RuleTriggerEvent = RuleTriggerEvent.on_enter
    action_type: RuleActionType
    task_type: Optional[TaskType] = None
    task_title_template: Optional[str] = Field(None, max_length=255)
    quick_reply_id: Optional[int] = None
    priority: TaskPriority = TaskPriority.medium
    description: Optional[str] = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_action_fields(self) -> 'StageRuleBase':
        if self.action_type == RuleActionType.create_task and self.task_type is None:
            raise ValueError("task_type is required when action_type is 'create_task'")
        if self.action_type == RuleActionType.suggest_reply and self.quick_reply_id is None:
            raise ValueError("quick_reply_id is required when action_type is 'suggest_reply'")
        return self

class StageRuleCreate(StageRuleBase):
    pass

class StageRuleUpdate(BaseModel):
    pipeline_id: Optional[int] = None
    stage_id: Optional[int] = None
    trigger_event: Optional[RuleTriggerEvent] = None
    action_type: Optional[RuleActionType] = None
    task_type: Optional[TaskType] = None
    task_title_template: Optional[str] = Field(None, max_length=255)
    quick_reply_id: Optional[int] = None
    priority: Optional[TaskPriority] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @model_validator(mode="after")
    def validate_action_fields(self) -> 'StageRuleUpdate':
        # Only validate fields if action_type is set during the update
        if self.action_type is not None:
            if self.action_type == RuleActionType.create_task and self.task_type is None:
                raise ValueError("task_type is required when action_type is 'create_task'")
            if self.action_type == RuleActionType.suggest_reply and self.quick_reply_id is None:
                raise ValueError("quick_reply_id is required when action_type is 'suggest_reply'")
        return self

from app.schemas.opportunity import PipelineResponse
from app.schemas.stage import StageResponse

class StageRuleResponse(StageRuleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    pipeline: Optional[PipelineResponse] = None
    stage: Optional[StageResponse] = None
    quick_reply: Optional[QuickReplyResponse] = None

    model_config = ConfigDict(from_attributes=True)
