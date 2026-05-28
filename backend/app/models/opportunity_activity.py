import uuid
from datetime import datetime
from typing import TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.enums import ActivityActionType

if TYPE_CHECKING:
    from app.models.opportunity import Opportunity

class OpportunityActivity(Base):
    __tablename__ = "opportunity_activities"

    id = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_type = sa.Column(
        sa.Enum(ActivityActionType, name="activity_action_type", create_type=True),
        nullable=False
    )
    from_stage_id = sa.Column(sa.Integer, sa.ForeignKey("opportunity_stages.id", ondelete="SET NULL"), nullable=True)
    to_stage_id = sa.Column(sa.Integer, sa.ForeignKey("opportunity_stages.id", ondelete="SET NULL"), nullable=True)
    extra_metadata = sa.Column("metadata", sa.JSON, nullable=True)
    description = sa.Column(sa.String, nullable=True)
    is_system = sa.Column(sa.Boolean, default=False, nullable=False)
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)

    opportunity = relationship("Opportunity", back_populates="activities")
