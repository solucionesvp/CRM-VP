"""
Bot Engine — Cerebro del bot de WhatsApp (Fase 2A).

Flujo:
  POST /bot/webhook → process_webhook → process_message
    → find_or_create_contact
    → find_or_create_conversation
    → save_message (entrada)
    → get_or_create_context
    → detect_intent
    → handle_intent → whatsapp_service.send_*

Intenciones soportadas:
  greeting       → bienvenida + menú
  select_sales   → oportunidad en pipeline "sales"
  select_service → oportunidad en pipeline "service"
  select_parts   → oportunidad en pipeline "parts"
  unknown        → reenvía menú
"""
import logging
import sqlalchemy as sa
from sqlalchemy.orm import Session
from app.models.contact import Contact
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.conversation_context import ConversationContext
from app.models.opportunity import Opportunity
from app.models.pipeline import Pipeline
from app.models.opportunity_stage import OpportunityStage
from app.models.enums import (
    ConversationChannel, ConversationStatus,
    MessageDirection, MessageSenderType, MessageType, MessageStatus,
    ContactType, OpportunityStatus,
)
from app.services import whatsapp_service
from app.services.business_info_service import get_business_info

logger = logging.getLogger(__name__)

# ── Palabras clave ─────────────────────────────────────────────────────────────

GREETING_KEYWORDS = {
    "hola", "hello", "hi", "buenas", "buenos", "buen", "dia", "inicio",
    "start", "empezar", "ayuda", "menu", "menú",
}
SALES_KEYWORDS = {
    "1", "venta", "ventas", "equipo", "equipos", "bomba", "bombas",
    "generador", "generadores", "comprar", "precio", "cotizar",
}
SERVICE_KEYWORDS = {
    "2", "taller", "servicio", "reparar", "reparacion", "reparación",
    "tecnico", "técnico", "mantenimiento",
}
PARTS_KEYWORDS = {
    "3", "refaccion", "refacción", "refacciones", "parte", "partes",
    "repuesto", "repuestos", "pieza", "piezas",
}

MENU_BUTTONS = [
    {"id": "select_sales",   "title": "🔧 Ventas de equipo"},
    {"id": "select_service", "title": "🛠️ Taller y servicio"},
    {"id": "select_parts",   "title": "⚙️ Refacciones"},
]

# ── Punto de entrada ───────────────────────────────────────────────────────────

async def process_webhook(payload: dict, db: Session):
    """Parsea el payload y procesa cada mensaje (Meta o Evolution API)."""
    try:
        # Detectar formato
        if payload.get("event") == "messages.upsert":
            # Formato Evolution API
            await process_evolution_message(payload, db)
        elif "entry" in payload:
            # Formato Meta Cloud API (legacy)
            entries = payload.get("entry", [])
            for entry in entries:
                changes = entry.get("changes", [])
                for change in changes:
                    value = change.get("value", {})
                    messages = value.get("messages", [])
                    for message in messages:
                        await process_message(message, db)
        else:
            logger.info(f"Webhook ignorado - formato desconocido: {list(payload.keys())}")
    except Exception as e:
        logger.error(f"Error procesando webhook: {e}", exc_info=True)


async def process_evolution_message(payload: dict, db: Session):
    """Procesa mensaje en formato Evolution API"""
    try:
        data = payload.get("data", {})
        key = data.get("key", {})
        
        # Ignorar mensajes enviados por nosotros
        if key.get("fromMe", False):
            return
        
        # Ignorar mensajes de grupos
        remote_jid = key.get("remoteJid", "")
        if "@g.us" in remote_jid:
            return
        
        # Extraer datos
        phone = remote_jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
        message_id = key.get("id", "")
        push_name = data.get("pushName", "")  # nombre del contacto en WhatsApp
        
        # Extraer contenido del mensaje
        message_obj = data.get("message", {})
        content = (
            message_obj.get("conversation") or
            message_obj.get("extendedTextMessage", {}).get("text") or
            message_obj.get("imageMessage", {}).get("caption") or
            message_obj.get("videoMessage", {}).get("caption") or
            message_obj.get("documentMessage", {}).get("caption") or
            "[media]"
        )
        
        # Detectar tipo de mensaje
        msg_type = "text"
        if "imageMessage" in message_obj:
            msg_type = "image"
        elif "audioMessage" in message_obj:
            msg_type = "audio"
        elif "videoMessage" in message_obj:
            msg_type = "video"
        elif "documentMessage" in message_obj:
            msg_type = "document"
        elif "locationMessage" in message_obj:
            msg_type = "location"
        
        if not phone:
            logger.warning("Mensaje sin número de teléfono, ignorando")
            return

        # Evitar duplicados
        if message_id:
            existing = db.query(Message).filter(
                Message.external_id == message_id
            ).first()
            if existing:
                return

        # Buscar o crear contacto
        # Si tenemos push_name y el contacto es nuevo, usarlo como nombre
        contact, is_new = find_or_create_contact(db, phone, push_name)
        
        # Buscar o crear conversación
        conversation = find_or_create_conversation(db, contact, phone)
        
        # Guardar mensaje
        save_message(db, conversation, message_id, content, msg_type, data)
        
        # Contexto del bot
        context = get_or_create_context(db, conversation)
        
        # Detectar intención
        intent = detect_intent(content, context, is_new)
        
        # Ejecutar acción
        await handle_intent(intent, phone, contact, conversation, context, db)
        
    except Exception as e:
        logger.error(f"Error procesando mensaje Evolution: {e}", exc_info=True)


async def process_message(message: dict, db: Session):
    """Procesa un mensaje individual."""
    try:
        phone      = message.get("from", "").strip()
        message_id = message.get("id")
        msg_type   = message.get("type", "text")

        # Extraer contenido
        if msg_type == "text":
            content = message.get("text", {}).get("body", "")
        elif msg_type == "interactive":
            btn = message.get("interactive", {}).get("button_reply", {})
            content = btn.get("id", "")
        else:
            content = ""

        if not phone:
            logger.warning("Mensaje sin número de teléfono, ignorando")
            return

        # Evitar duplicados
        if message_id and db.query(Message).filter(
            Message.external_id == message_id
        ).first():
            logger.info(f"Mensaje duplicado {message_id}, ignorando")
            return

        contact, is_new      = find_or_create_contact(db, phone)
        conversation         = find_or_create_conversation(db, contact, phone)
        save_message(db, conversation, message_id, content, msg_type, message)
        context              = get_or_create_context(db, conversation)
        intent               = detect_intent(content, context, is_new)
        await handle_intent(intent, phone, contact, conversation, context, db)

    except Exception:
        logger.exception(f"Error procesando mensaje de {message.get('from')}")


# ── Helpers de BD ──────────────────────────────────────────────────────────────

def find_or_create_contact(db: Session, phone: str, push_name: str = "") -> tuple:
    """Busca contacto por teléfono/whatsapp; lo crea si no existe."""
    normalized = phone.strip().replace("+", "").replace(" ", "")
    
    contact = db.query(Contact).filter(
        (Contact.whatsapp == normalized) | 
        (Contact.whatsapp == f"+{normalized}") |
        (Contact.phone == normalized) |
        (Contact.phone == f"+{normalized}")
    ).first()
    
    if contact:
        # Si el contacto tiene nombre placeholder y ahora tenemos el real
        if push_name and contact.name.startswith("WhatsApp "):
            contact.name = push_name
            db.commit()
        return contact, False
    
    # Crear contacto con nombre real si disponible
    name = push_name if push_name else f"WhatsApp {normalized}"
    contact = Contact(
        type=ContactType.person,
        name=name,
        whatsapp=normalized,
        phone=normalized,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    logger.info(f"Contacto nuevo: {contact.id} — {phone}")
    return contact, True


def find_or_create_conversation(db: Session, contact: Contact, phone: str) -> Conversation:
    """
    Busca conversación existente por canal+identificador.
    La UniqueConstraint en (channel, channel_identifier) garantiza
    que solo existe una fila por teléfono/canal.
    Nota: comparamos con el .value del enum (lowercase) para que coincida
    con el tipo PostgreSQL definido en la migración.
    """
    conversation = db.query(Conversation).filter(
        Conversation.contact_id         == contact.id,
        Conversation.channel            == ConversationChannel.WHATSAPP,
        Conversation.channel_identifier == phone,
    ).first()

    if conversation:
        return conversation

    conversation = Conversation(
        contact_id=contact.id,
        channel=ConversationChannel.WHATSAPP,
        channel_identifier=phone,
        status=ConversationStatus.OPEN,
        bot_active=True,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def save_message(
    db: Session, conversation: Conversation,
    external_id: str, content: str, msg_type: str, raw: dict
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


# ── Detección de intención ─────────────────────────────────────────────────────

def detect_intent(content: str, context: ConversationContext, is_new: bool) -> str:
    if not content:
        return "unknown"

    text = content.lower().strip()
    words = set(text.split())

    # Botones interactivos tienen id exacto
    if text in {"select_sales", "select_service", "select_parts"}:
        return text

    # Contacto nuevo o saludo
    if is_new or words & GREETING_KEYWORDS:
        return "greeting"

    if words & SALES_KEYWORDS:
        return "select_sales"
    if words & SERVICE_KEYWORDS:
        return "select_service"
    if words & PARTS_KEYWORDS:
        return "select_parts"

    return "unknown"


# ── Manejadores de intención ───────────────────────────────────────────────────

async def handle_intent(
    intent: str, phone: str, contact: Contact,
    conversation: Conversation, context: ConversationContext, db: Session
):
    if intent == "greeting":
        await _send_welcome(phone, contact, conversation, context, db)
    elif intent == "select_sales":
        await _handle_area(phone, contact, conversation, context, db,
                           pipeline_slug="sales",
                           area_name="Ventas de equipo",
                           reply="¡Perfecto! Un asesor de ventas te atenderá pronto. ¿Qué equipo necesitas?")
    elif intent == "select_service":
        await _handle_area(phone, contact, conversation, context, db,
                           pipeline_slug="service",
                           area_name="Taller y servicio técnico",
                           reply="¡Entendido! Nuestro equipo técnico te atenderá pronto. ¿Qué equipo requiere servicio?")
    elif intent == "select_parts":
        await _handle_area(phone, contact, conversation, context, db,
                           pipeline_slug="parts",
                           area_name="Refacciones",
                           reply="¡Claro! Te ayudamos con refacciones. ¿Qué pieza necesitas?")
    else:
        await whatsapp_service.send_interactive_message(
            to=phone,
            body="No entendí tu mensaje 😊 Por favor selecciona una opción:",
            buttons=MENU_BUTTONS,
        )


async def _send_welcome(
    phone: str, contact: Contact, conversation: Conversation,
    context: ConversationContext, db: Session
):
    info = get_business_info(db)
    body = info.bot_welcome_message if (info and info.bot_welcome_message) else (
        "¡Hola! Soy el asistente de VP Equipos y Soluciones. ¿En qué te puedo ayudar?"
    )
    await whatsapp_service.send_interactive_message(
        to=phone, body=body, buttons=MENU_BUTTONS
    )
    context.current_flow    = "welcome"
    context.current_intent  = "greeting"
    context.last_bot_action = "send_welcome"
    db.commit()


async def _handle_area(
    phone: str, contact: Contact, conversation: Conversation,
    context: ConversationContext, db: Session,
    pipeline_slug: str, area_name: str, reply: str
):
    await whatsapp_service.send_text_message(to=phone, message=reply)

    # Crear oportunidad solo si la conversación aún no tiene una
    if not conversation.opportunity_id:
        pipeline = db.query(Pipeline).filter(
            Pipeline.slug == pipeline_slug, Pipeline.is_active == True
        ).first()
        if pipeline:
            first_stage = (
                db.query(OpportunityStage)
                .filter(OpportunityStage.pipeline_id == pipeline.id)
                .order_by(OpportunityStage.order)
                .first()
            )
            if first_stage:
                opp = Opportunity(
                    contact_id=contact.id,
                    pipeline_id=pipeline.id,
                    stage_id=first_stage.id,
                    title=f"WhatsApp — {area_name}",
                    product_interest=area_name,   # campo NOT NULL
                    status=OpportunityStatus.active,
                    source="whatsapp",
                )
                db.add(opp)
                db.flush()
                conversation.opportunity_id = opp.id
                db.commit()
                logger.info(f"Oportunidad creada: {opp.id} — {area_name}")

    conversation.assigned_department = pipeline_slug
    context.current_flow    = pipeline_slug
    context.current_intent  = f"select_{pipeline_slug}"
    context.last_bot_action = f"handle_{pipeline_slug}"
    context.collected_data  = {**(context.collected_data or {}), "area": area_name}
    db.commit()
