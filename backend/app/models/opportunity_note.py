import uuid
from datetime import datetime
from typing import TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base

if TYPE_CHECKING:
    from app.models.opportunity import Opportunity

class OpportunityNote(Base):
    __tablename__ = "opportunity_notes"

    id = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content = sa.Column(sa.Text, nullable=False)
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)

    opportunity = relationship("Opportunity", back_populates="notes")
