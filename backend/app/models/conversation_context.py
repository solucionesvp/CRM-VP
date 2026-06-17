import uuid
from datetime import datetime
from typing import TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base

if TYPE_CHECKING:
    from app.models.conversation import Conversation


class ConversationContext(Base):
    """Per-conversation bot memory and flow state."""
    __tablename__ = "conversation_contexts"

    id              = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = sa.Column(sa.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, unique=True)

    # ── Flow state ─────────────────────────────────────────────────────────────
    current_intent  = sa.Column(sa.String,  nullable=True)
    current_flow    = sa.Column(sa.String,  nullable=True)
    current_step    = sa.Column(sa.String,  nullable=True)
    collected_data  = sa.Column(sa.JSON,    nullable=True, default=dict)
    last_bot_action = sa.Column(sa.String,  nullable=True)
    last_bot_message_at = sa.Column(sa.DateTime, nullable=True)

    # ── Awaiting user reply ─────────────────────────────────────────────────────
    awaiting_response = sa.Column(sa.Boolean, nullable=False, default=False)
    awaiting_field    = sa.Column(sa.String,  nullable=True)

    # ── Human handoff ──────────────────────────────────────────────────────────
    handoff_to_human = sa.Column(sa.Boolean, nullable=False, default=False)
    handoff_reason   = sa.Column(sa.String,  nullable=True)
    # Resumen legible generado por la IA al escalar; visible para el agente humano
    handoff_summary  = sa.Column(sa.Text,    nullable=True)

    # ── Long-term bot memory (arbitrary key-value store) ───────────────────────
    bot_memory = sa.Column(sa.JSON, nullable=True, default=dict)

    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = sa.Column(sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    conversation = relationship("Conversation", back_populates="context")
