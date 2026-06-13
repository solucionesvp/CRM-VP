import sqlalchemy as sa
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base
from app.models.enums import RuleTriggerEvent, RuleActionType, TaskType, TaskPriority

class StageRule(Base):
    __tablename__ = "stage_rules"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    pipeline_id = sa.Column(
        sa.Integer,
        sa.ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False
    )
    stage_id = sa.Column(
        sa.Integer,
        sa.ForeignKey("opportunity_stages.id", ondelete="CASCADE"),
        nullable=False
    )
    trigger_event = sa.Column(
        sa.Enum(RuleTriggerEvent, name="ruletriggerevent"),
        nullable=False,
        default=RuleTriggerEvent.on_enter
    )
    action_type = sa.Column(
        sa.Enum(RuleActionType, name="ruleactiontype"),
        nullable=False
    )
    task_type = sa.Column(
        sa.Enum(TaskType, name="tasktype"),
        nullable=True
    )
    task_title_template = sa.Column(sa.String(255), nullable=True)
    quick_reply_id = sa.Column(
        sa.Integer,
        sa.ForeignKey("quick_replies.id", ondelete="SET NULL"),
        nullable=True
    )
    priority = sa.Column(
        sa.Enum(TaskPriority, name="taskpriority"),
        nullable=False,
        default=TaskPriority.medium
    )
    description = sa.Column(sa.Text, nullable=True)
    is_active = sa.Column(sa.Boolean, nullable=False, default=True)
    created_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    pipeline = relationship("Pipeline")
    stage = relationship("OpportunityStage")
    quick_reply = relationship("QuickReply")
