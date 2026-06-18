"""
Helpers de base de datos para el bot: find_or_create de contacto,
conversación, contexto y persistencia de mensajes.

Extraídos de bot_engine.py para mantener ese archivo ≤ 100 líneas.
"""
import logging
from sqlalchemy.orm import Session, joinedload
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.conversation_context import ConversationContext
from app.models.message import Message
from app.models.opportunity import Opportunity
from app.models.enums import (
    ConversationChannel, ConversationStatus,
    MessageDirection, MessageSenderType, MessageType, MessageStatus,
    ContactType,
)

logger = logging.getLogger(__name__)

_HISTORY_LIMIT = 6   # mensajes recientes enviados como contexto a la IA


def find_or_create_contact(db: Session, phone: str, push_name: str = "") -> tuple:
    """Busca contacto por teléfono; lo crea si no existe."""
    normalized = phone.strip().replace("+", "").replace(" ", "")
    contact = db.query(Contact).filter(
        (Contact.whatsapp == normalized) |
        (Contact.whatsapp == f"+{normalized}") |
        (Contact.phone    == normalized) |
        (Contact.phone    == f"+{normalized}")
    ).first()
    if contact:
        if push_name and contact.name.startswith("WhatsApp "):
            contact.name = push_name
            db.commit()
        return contact, False
    name = push_name or f"WhatsApp {normalized}"
    contact = Contact(type=ContactType.person, name=name, whatsapp=normalized, phone=normalized)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    logger.info(f"Contacto nuevo: {contact.id} — {phone}")
    return contact, True


def find_or_create_conversation(db: Session, contact: Contact, phone: str) -> Conversation:
    """Busca conversación existente por canal+teléfono; la crea si no existe."""
    conv = db.query(Conversation).filter(
        Conversation.contact_id         == contact.id,
        Conversation.channel            == ConversationChannel.WHATSAPP,
        Conversation.channel_identifier == phone,
    ).first()
    if conv:
        return conv
    conv = Conversation(
        contact_id=contact.id,
        channel=ConversationChannel.WHATSAPP,
        channel_identifier=phone,
        status=ConversationStatus.OPEN,
        bot_active=True,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def save_message(
    db: Session, conversation: Conversation,
    external_id: str, content: str, msg_type: str, raw: dict,
) -> Message:
    """Persiste el mensaje entrante y actualiza el preview de la conversación."""
    mtype = MessageType.TEXT if msg_type == "text" else MessageType.SYSTEM
    msg = Message(
        conversation_id=conversation.id,
        external_id=external_id,
        direction=MessageDirection.INBOUND,
        sender_type=MessageSenderType.CLIENT,
        message_type=mtype,
        content=content,
        raw_payload=raw,
        status=MessageStatus.DELIVERED,
    )
    db.add(msg)
    conversation.last_message_preview = (content or "")[:100]
    db.commit()
    return msg


def get_or_create_context(db: Session, conversation: Conversation) -> ConversationContext:
    if conversation.context:
        return conversation.context
    ctx = ConversationContext(
        conversation_id=conversation.id,
        collected_data={},
        bot_memory={},
    )
    db.add(ctx)
    db.commit()
    db.refresh(ctx)
    return ctx



def get_pending_messages(db: Session, conversation_id) -> list[str]:
    """
    Retorna el texto de todos los mensajes INBOUND recibidos desde
    el último mensaje OUTBOUND del bot — es decir, el lote aún no procesado.
    """
    last_out = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id,
                Message.direction == MessageDirection.OUTBOUND)
        .order_by(Message.created_at.desc())
        .first()
    )
    q = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id,
                Message.direction == MessageDirection.INBOUND,
                Message.message_type == MessageType.TEXT)
    )
    if last_out:
        q = q.filter(Message.created_at > last_out.created_at)
    msgs = q.order_by(Message.created_at.asc()).all()
    return [m.content for m in msgs if m.content and m.content != "[media]"]


def build_history_before(db: Session, conversation_id) -> list:
    """
    Historial de mensajes HASTA el último mensaje del bot (excluye el lote
    pendiente) en formato OpenAI. Garantiza que history y el batch pendiente
    no se solapen.
    """
    last_out = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id,
                Message.direction == MessageDirection.OUTBOUND)
        .order_by(Message.created_at.desc())
        .first()
    )
    q = db.query(Message).filter(Message.conversation_id == conversation_id)
    if last_out:
        q = q.filter(Message.created_at <= last_out.created_at)
    msgs = list(reversed(
        q.order_by(Message.created_at.desc()).limit(_HISTORY_LIMIT).all()
    ))
    return [
        {"role": "assistant" if m.sender_type.value in ("bot", "human") else "user",
         "content": m.content}
        for m in msgs if m.content and m.content != "[media]"
    ]


def build_customer_history_context(db: Session, contact: Contact) -> str:
    """Retorna resumen de oportunidades recientes del contacto para el prompt del bot."""
    opps = (
        db.query(Opportunity)
        .options(joinedload(Opportunity.stage), joinedload(Opportunity.pipeline))
        .filter(
            Opportunity.contact_id == contact.id,
            Opportunity.deleted_at == None,
        )
        .order_by(Opportunity.created_at.desc())
        .limit(3)
        .all()
    )
    if not opps:
        return "Cliente nuevo, sin historial previo en el CRM."
    lineas = []
    for opp in opps:
        pipeline_name = opp.pipeline.name if opp.pipeline else "?"
        stage_name    = opp.stage.name    if opp.stage    else "?"
        fecha         = opp.created_at.strftime("%d/%m/%Y")
        lineas.append(f"- {pipeline_name}: etapa '{stage_name}', estado {opp.status.value}, desde {fecha}")
    return "Cliente existente. Historial reciente:\n" + "\n".join(lineas)

