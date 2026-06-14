import uuid
from datetime import datetime
from typing import TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.enums import ConversationChannel, ConversationStatus

if TYPE_CHECKING:
    from app.models.contact import Contact
    from app.models.user import User
    from app.models.opportunity import Opportunity
    from app.models.message import Message
    from app.models.conversation_context import ConversationContext


class Conversation(Base):
    __tablename__ = "conversations"

    id                   = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_id           = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    channel              = sa.Column(sa.Enum(ConversationChannel, name="conversationchannel", create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ConversationChannel.WHATSAPP)
    channel_identifier   = sa.Column(sa.String, nullable=False, index=True)  # e.g. "+523111234567"
    status               = sa.Column(sa.Enum(ConversationStatus, name="conversationstatus", create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ConversationStatus.OPEN, index=True)
    assigned_to_user_id  = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_department  = sa.Column(sa.String, nullable=True)   # "sales", "service", "parts"
    bot_active           = sa.Column(sa.Boolean, nullable=False, default=True)
    last_message_at      = sa.Column(sa.DateTime, nullable=True, index=True)
    last_message_preview = sa.Column(sa.String, nullable=True)   # first ~100 chars
    unread_count         = sa.Column(sa.Integer, nullable=False, default=0)
    opportunity_id       = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True)
    closed_at            = sa.Column(sa.DateTime, nullable=True)
    created_at           = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at           = sa.Column(sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        sa.Index("idx_conversations_contact",     "contact_id"),
        sa.Index("idx_conversations_status",      "status"),
        sa.Index("idx_conversations_assigned",    "assigned_to_user_id"),
        sa.Index("idx_conversations_last_msg",    "last_message_at"),
        sa.UniqueConstraint("channel", "channel_identifier", name="uq_conversation_channel_identifier"),
    )

    # Relationships
    contact     = relationship("Contact",     back_populates="conversations")
    assigned_to = relationship("User",        back_populates="assigned_conversations", foreign_keys=[assigned_to_user_id])
    opportunity = relationship("Opportunity", back_populates="conversations")
    messages    = relationship("Message",     back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
    context     = relationship("ConversationContext", back_populates="conversation", uselist=False, cascade="all, delete-orphan")
