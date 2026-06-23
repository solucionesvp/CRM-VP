import uuid
from datetime import datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.orm import relationship

from app.database.session import Base

if TYPE_CHECKING:
    from app.models.opportunity import Opportunity


class OpportunityAttachment(Base):
    __tablename__ = "opportunity_attachments"

    id             = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename       = sa.Column(sa.String, nullable=False)   # nombre original del archivo
    file_key       = sa.Column(sa.String, nullable=False)   # clave en R2: "opp-attachments/{opp_id}/{uuid}_{filename}"
    file_url       = sa.Column(sa.String, nullable=False)   # URL pública en R2
    content_type   = sa.Column(sa.String, nullable=False)   # MIME type
    file_size      = sa.Column(sa.Integer, nullable=True)   # bytes
    uploaded_by    = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at     = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)

    opportunity = relationship("Opportunity", back_populates="attachments")
