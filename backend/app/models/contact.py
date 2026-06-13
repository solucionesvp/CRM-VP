import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.enums import ContactType, ContactSource

if TYPE_CHECKING:
    from app.models.opportunity import Opportunity

class Contact(Base):
    __tablename__ = "contacts"

    id = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = sa.Column(
        sa.Enum(ContactType, name="contact_type", create_type=True),
        nullable=False
    )
    name = sa.Column(sa.String, nullable=False)
    company_name = sa.Column(sa.String, nullable=True)
    phone = sa.Column(sa.String, nullable=True)
    whatsapp = sa.Column(sa.String, nullable=True)
    email = sa.Column(sa.String, nullable=True)
    source = sa.Column(
        sa.Enum(ContactSource, name="contact_source", create_type=True),
        nullable=True
    )
    address = sa.Column(sa.String, nullable=True)
    city = sa.Column(sa.String, nullable=True, default="Tepic")
    tags = sa.Column(postgresql.ARRAY(sa.String), nullable=True, default=list)
    notes = sa.Column(sa.Text, nullable=True)
    is_active = sa.Column(sa.Boolean, default=True, nullable=False)
    
    assigned_to = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    created_by = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = sa.Column(
        sa.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    deleted_at = sa.Column(sa.DateTime, nullable=True)

    __table_args__ = (
        sa.Index("idx_contacts_phone", "phone"),
        sa.Index("idx_contacts_assigned_to", "assigned_to"),
    )

    opportunities = relationship("Opportunity", back_populates="contact")

    @property
    def opportunities_count(self) -> int:
        return len([opp for opp in self.opportunities if opp.deleted_at is None])

    @property
    def has_open_opportunities(self) -> bool:
        from app.models.enums import OpportunityStatus
        return any(opp.status == OpportunityStatus.active for opp in self.opportunities if opp.deleted_at is None)

    @property
    def primary_interest(self) -> str:
        from app.models.enums import OpportunityStatus
        valid_opps = [opp for opp in self.opportunities if opp.deleted_at is None]
        if not valid_opps:
            return None
        active_opps = [opp for opp in valid_opps if opp.status == OpportunityStatus.active]
        target_opp = None
        if active_opps:
            active_opps.sort(key=lambda x: x.created_at, reverse=True)
            target_opp = active_opps[0]
        else:
            valid_opps.sort(key=lambda x: x.created_at, reverse=True)
            target_opp = valid_opps[0]
            
        if target_opp.product_service:
            return target_opp.product_service.name
        return target_opp.product_interest

    @property
    def next_task(self):
        from app.models.enums import TaskStatus
        pending_tasks = [t for t in self.tasks if t.status == TaskStatus.pending]
        if not pending_tasks:
            return None
        pending_tasks.sort(key=lambda x: (x.due_date is None, x.due_date))
        return pending_tasks[0]

