"""
Conversation service — lógica de negocio para la bandeja de conversaciones.
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.conversation import Conversation
from app.models.conversation_context import ConversationContext
from app.models.message import Message
from app.models.opportunity import Opportunity
from app.models.opportunity_stage import OpportunityStage
from app.models.contact import Contact
from app.models.enums import (
    MessageDirection, MessageSenderType, MessageType, MessageStatus,
    OpportunityStatus,
)
from app.services import whatsapp_service

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── Queries ────────────────────────────────────────────────────────────────────

def list_conversations(
    db: Session,
    status: Optional[str] = None,
    assigned_department: Optional[str] = None,
    assigned_to_user_id: Optional[UUID] = None,
    bot_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = 1,
    size: int = 30,
) -> tuple[List[Conversation], int]:
    q = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.contact).selectinload(Contact.tags_rel),
            joinedload(Conversation.opportunity),
        )
        .order_by(Conversation.last_message_at.desc().nullslast(), Conversation.created_at.desc())
    )
    if status:
        q = q.filter(Conversation.status == status)
    if assigned_department:
        q = q.filter(Conversation.assigned_department == assigned_department)
    if assigned_to_user_id:
        q = q.filter(Conversation.assigned_to_user_id == assigned_to_user_id)
    if bot_active is not None:
        q = q.filter(Conversation.bot_active == bot_active)
    if search:
        pattern = f"%{search}%"
        q = q.join(Conversation.contact, isouter=True).filter(
            or_(
                Conversation.contact.has(Conversation.contact.property.mapper.class_.name.ilike(pattern)),
                Conversation.last_message_preview.ilike(pattern),
            )
        )
    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return items, total


def get_conversation(db: Session, conv_id: UUID) -> Optional[Conversation]:
    return (
        db.query(Conversation)
        .options(joinedload(Conversation.contact), joinedload(Conversation.opportunity))
        .filter(Conversation.id == conv_id)
        .first()
    )


def get_messages(
    db: Session, conv_id: UUID, page: int = 1, size: int = 100
) -> List[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )


def get_last_message(db: Session, conv_id: UUID) -> Optional[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conv_id)
        .order_by(Message.created_at.desc())
        .first()
    )


# ── Mutations ──────────────────────────────────────────────────────────────────

async def send_message(
    db: Session, conv_id: UUID, text: str
) -> Message:
    """Envía mensaje via Evolution API y lo guarda en BD."""
    conv = get_conversation(db, conv_id)
    if not conv:
        raise ValueError("Conversación no encontrada")

    phone = conv.channel_identifier

    # Enviar via Evolution API
    try:
        await whatsapp_service.send_message_evolution(phone=phone, text=text)
    except Exception as e:
        logger.warning(f"Error enviando mensaje a Evolution API: {e}")

    # Guardar en BD
    msg = Message(
        conversation_id=conv_id,
        direction=MessageDirection.OUTBOUND,
        sender_type=MessageSenderType.HUMAN,
        message_type=MessageType.TEXT,
        content=text,
        status=MessageStatus.SENT,
        sent_at=_now(),
    )
    db.add(msg)
    conv.last_message_preview = text[:100]
    conv.last_message_at = _now()
    db.commit()
    db.refresh(msg)
    return msg


def update_conversation(
    db: Session, conv_id: UUID, updates: dict
) -> Optional[Conversation]:
    conv = get_conversation(db, conv_id)
    if not conv:
        return None
    for field, value in updates.items():
        if field != "reset_handoff":
            setattr(conv, field, value)

    if updates.get("reset_handoff"):
        ctx = db.query(ConversationContext).filter(
            ConversationContext.conversation_id == conv_id
        ).first()
        if ctx:
            ctx.handoff_to_human = False
            ctx.handoff_reason = None

    db.commit()
    db.refresh(conv)
    return conv


def assign_conversation(
    db: Session, conv_id: UUID, department: Optional[str], user_id: Optional[UUID]
) -> Optional[Conversation]:
    conv = get_conversation(db, conv_id)
    if not conv:
        return None
    if department is not None:
        conv.assigned_department = department
    if user_id is not None:
        conv.assigned_to_user_id = user_id
        conv.status = "assigned"
        conv.bot_active = False  # desactivar bot al asignar a humano
    db.commit()
    db.refresh(conv)
    return conv


def create_opportunity_for_conversation(
    db: Session,
    conv_id: UUID,
    pipeline_id: int,
    title: str,
    product_interest: str,
) -> Opportunity:
    conv = get_conversation(db, conv_id)
    if not conv:
        raise ValueError("Conversación no encontrada")

    first_stage = (
        db.query(OpportunityStage)
        .filter(OpportunityStage.pipeline_id == pipeline_id)
        .order_by(OpportunityStage.order)
        .first()
    )
    if not first_stage:
        raise ValueError("Pipeline sin etapas configuradas")

    opp = Opportunity(
        contact_id=conv.contact_id,
        pipeline_id=pipeline_id,
        stage_id=first_stage.id,
        title=title,
        product_interest=product_interest,
        status=OpportunityStatus.active,
        source="whatsapp",
    )
    db.add(opp)
    db.flush()
    conv.opportunity_id = opp.id
    db.commit()
    db.refresh(opp)
    return opp
