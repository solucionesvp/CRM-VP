import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.enums import OpportunityPriority, OpportunityStatus

if TYPE_CHECKING:
    from app.models.contact import Contact
    from app.models.opportunity_stage import OpportunityStage
    from app.models.opportunity_note import OpportunityNote
    from app.models.opportunity_activity import OpportunityActivity
    from app.models.pipeline import Pipeline

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    title = sa.Column(sa.String, nullable=False)
    product_interest = sa.Column(sa.String, nullable=False)
    stage_id = sa.Column(sa.Integer, sa.ForeignKey("opportunity_stages.id", ondelete="RESTRICT"), nullable=False)
    assigned_to = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expected_value = sa.Column(sa.Numeric(10, 2), nullable=True)
    currency = sa.Column(sa.String, nullable=False, default="MXN")
    expected_close_date = sa.Column(sa.Date, nullable=True)
    priority = sa.Column(
        sa.Enum(OpportunityPriority, name="opportunity_priority", create_type=True),
        nullable=False,
        default=OpportunityPriority.medium
    )
    status = sa.Column(
        sa.Enum(OpportunityStatus, name="opportunity_status", create_type=True),
        nullable=False,
        default=OpportunityStatus.active
    )
    won_at = sa.Column(sa.DateTime, nullable=True)
    lost_at = sa.Column(sa.DateTime, nullable=True)
    lost_reason = sa.Column(sa.String, nullable=True)
    source = sa.Column(sa.String, nullable=True)
    created_by = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = sa.Column(
        sa.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    pipeline_id = sa.Column(sa.Integer, sa.ForeignKey("pipelines.id", ondelete="RESTRICT"), nullable=False)
    deleted_at = sa.Column(sa.DateTime, nullable=True)

    __table_args__ = (
        sa.Index("idx_opportunities_contact_id", "contact_id"),
        sa.Index("idx_opportunities_stage_id", "stage_id"),
        sa.Index("idx_opportunities_assigned_to", "assigned_to"),
        sa.Index("idx_opportunities_status", "status"),
        sa.Index("idx_opportunities_pipeline_id", "pipeline_id"),
    )

    contact = relationship("Contact", back_populates="opportunities")
    stage = relationship("OpportunityStage")
    pipeline = relationship("Pipeline")
    notes = relationship("OpportunityNote", back_populates="opportunity", cascade="all, delete-orphan")
    activities = relationship("OpportunityActivity", back_populates="opportunity", cascade="all, delete-orphan")
