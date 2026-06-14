import uuid
from datetime import datetime
from typing import TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.enums import MessageDirection, MessageSenderType, MessageType, MessageStatus

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.user import User


class Message(Base):
    __tablename__ = "messages"

    id              = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    external_id     = sa.Column(sa.String, nullable=True, index=True)   # WhatsApp wamid — prevents duplicates
    direction       = sa.Column(sa.Enum(MessageDirection,   name="messagedirection",   create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False, index=True)
    sender_type     = sa.Column(sa.Enum(MessageSenderType,  name="messagesendertype",  create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False)
    sender_user_id  = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    message_type    = sa.Column(sa.Enum(MessageType,        name="messagetype",        create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False, default=MessageType.TEXT)
    content         = sa.Column(sa.Text, nullable=True)  # text body or caption

    # ── Media ──────────────────────────────────────────────────────────────────
    media_url               = sa.Column(sa.String,  nullable=True)
    media_mime_type         = sa.Column(sa.String,  nullable=True)
    media_filename          = sa.Column(sa.String,  nullable=True)
    media_size_bytes        = sa.Column(sa.Integer, nullable=True)
    media_duration_seconds  = sa.Column(sa.Integer, nullable=True)
    media_caption           = sa.Column(sa.Text,    nullable=True)
    media_thumbnail_url     = sa.Column(sa.String,  nullable=True)

    # ── Location ───────────────────────────────────────────────────────────────
    location_latitude  = sa.Column(sa.Float,  nullable=True)
    location_longitude = sa.Column(sa.Float,  nullable=True)
    location_name      = sa.Column(sa.String, nullable=True)
    location_address   = sa.Column(sa.String, nullable=True)

    # ── Shared contact card ────────────────────────────────────────────────────
    contact_data = sa.Column(sa.JSON, nullable=True)

    # ── Delivery state ─────────────────────────────────────────────────────────
    status          = sa.Column(sa.Enum(MessageStatus, name="messagestatus", create_type=False, values_callable=lambda x: [e.value for e in x]), nullable=False, default=MessageStatus.PENDING)
    error_message   = sa.Column(sa.Text, nullable=True)
    raw_payload     = sa.Column(sa.JSON, nullable=True)  # full webhook payload

    # ── Thread ─────────────────────────────────────────────────────────────────
    replied_to_message_id = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)

    # ── Timestamps ─────────────────────────────────────────────────────────────
    sent_at      = sa.Column(sa.DateTime, nullable=True)
    delivered_at = sa.Column(sa.DateTime, nullable=True)
    read_at      = sa.Column(sa.DateTime, nullable=True)
    created_at   = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at   = sa.Column(sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        sa.Index("idx_messages_conversation", "conversation_id"),
        sa.Index("idx_messages_external",     "external_id"),
        sa.Index("idx_messages_direction",    "direction"),
        sa.Index("idx_messages_created",      "created_at"),
    )

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender_user  = relationship("User", foreign_keys=[sender_user_id])
    replied_to   = relationship("Message", remote_side="Message.id")
