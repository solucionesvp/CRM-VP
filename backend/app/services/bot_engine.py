"""
Bot Engine — Orquestador del bot de WhatsApp.

Flujo con debounce (ventana de 8 s para mensajes fragmentados):
  POST /bot/webhook → parse → save_message → schedule_debounce → {"status":"ok"}
  [BOT_DEBOUNCE_SECONDS sin nuevo mensaje] → _process_debounced()
    → get_pending_messages() — junta todos los fragmentos en orden
    → ai_classifier_service.classify()
    → bot_responder.handle_result()

Este archivo solo orquesta. Lógica de BD: bot_db_helpers.py
Debounce: message_debouncer.py | IA: ai_classifier_service.py
Respuestas: bot_responder.py
"""
import logging
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.database.session import SessionLocal
from app.models.conversation import Conversation
from app.models.message import Message
from app.services import ai_classifier_service, bot_responder, message_debouncer
from app.services import bot_db_helpers as db_h
from app.services.business_info_service import get_business_info

logger = logging.getLogger(__name__)


# ── Punto de entrada ───────────────────────────────────────────────────────────

async def process_webhook(payload: dict, db: Session):
    """Parsea el payload y despacha según el formato (Evolution API o Meta Cloud)."""
    try:
        if payload.get("event") == "messages.upsert":
            await process_evolution_message(payload, db)
        elif "entry" in payload:
            for entry in payload.get("entry", []):
                for change in entry.get("changes", []):
                    for msg in change.get("value", {}).get("messages", []):
                        await process_message(msg, db)
        else:
            logger.info(f"Webhook ignorado — formato desconocido: {list(payload.keys())}")
    except Exception as e:
        logger.error(f"Error procesando webhook: {e}", exc_info=True)


async def process_evolution_message(payload: dict, db: Session):
    """Procesa mensaje en formato Evolution API."""
    try:
        data = payload.get("data", {})
        key  = data.get("key", {})
        if key.get("fromMe", False):
            return
        remote_jid = key.get("remoteJid", "")
        if "@g.us" in remote_jid:
            return

        phone      = remote_jid.replace("@s.whatsapp.net", "").replace("@c.us", "")
        message_id = key.get("id", "")
        push_name  = data.get("pushName", "")
        msg_obj    = data.get("message", {})
        content    = (
            msg_obj.get("conversation")
            or msg_obj.get("extendedTextMessage", {}).get("text")
            or msg_obj.get("imageMessage", {}).get("caption")
            or msg_obj.get("videoMessage", {}).get("caption")
            or "[media]"
        )
        msg_type = next(
            (t for t in ("image", "audio", "video", "document", "location") if f"{t}Message" in msg_obj),
            "text",
        )
        if not phone:
            return
        if message_id and db.query(Message).filter(Message.external_id == message_id).first():
            return
        await _save_and_schedule(db, phone, push_name, message_id, content, msg_type, data)
    except Exception as e:
        logger.error(f"Error Evolution: {e}", exc_info=True)


async def process_message(message: dict, db: Session):
    """Procesa mensaje en formato Meta Cloud API (legacy)."""
    try:
        phone      = message.get("from", "").strip()
        message_id = message.get("id")
        msg_type   = message.get("type", "text")
        content    = (
            message.get("text", {}).get("body", "") if msg_type == "text"
            else message.get("interactive", {}).get("button_reply", {}).get("id", "")
        )
        if not phone:
            return
        if message_id and db.query(Message).filter(Message.external_id == message_id).first():
            return
        await _save_and_schedule(db, phone, "", message_id, content, msg_type, message)
    except Exception:
        logger.exception(f"Error mensaje {message.get('from')}")


# ── Pipeline ───────────────────────────────────────────────────────────────────

async def _save_and_schedule(
    db: Session, phone: str, push_name: str,
    message_id: str, content: str, msg_type: str, raw: dict,
) -> None:
    """Persiste el mensaje y (re)programa el timer de debounce."""
    contact, _   = db_h.find_or_create_contact(db, phone, push_name)
    conversation = db_h.find_or_create_conversation(db, contact, phone)
    db_h.save_message(db, conversation, message_id, content, msg_type, raw)
    context      = db_h.get_or_create_context(db, conversation)

    if not conversation.bot_active or context.handoff_to_human:
        return   # humano ya atiende — silencio

    conv_id = conversation.id

    async def _deferred():
        new_db = SessionLocal()
        try:
            await _process_debounced(new_db, conv_id)
        except Exception as exc:
            logger.error(f"Error en procesamiento diferido: {exc}", exc_info=True)
            new_db.rollback()
        finally:
            new_db.close()

    await message_debouncer.schedule(conv_id, _deferred, settings.BOT_DEBOUNCE_SECONDS)


async def _process_debounced(db: Session, conv_id) -> None:
    """Procesa todos los mensajes pendientes de la conversación como un solo bloque."""
    conv = (
        db.query(Conversation)
        .options(joinedload(Conversation.contact), joinedload(Conversation.context))
        .filter(Conversation.id == conv_id)
        .first()
    )
    if not conv or not conv.bot_active:
        return
    context = db_h.get_or_create_context(db, conv)
    if context.handoff_to_human:
        return

    pending = db_h.get_pending_messages(db, conv_id)
    if not pending:
        return

    combined = "\n".join(pending)   # todos los fragmentos juntos como un mensaje
    info     = get_business_info(db)
    biz_ctx  = bot_responder.build_business_context(info)
    cust_hist = db_h.build_customer_history_context(db, conv.contact)
    history  = db_h.build_history_before(db, conv_id)

    collected = dict(context.collected_data or {})
    if "nombre" not in collected and not conv.contact.name.startswith("WhatsApp "):
        collected["nombre"] = conv.contact.name

    result = await ai_classifier_service.classify(
        message_text=combined,
        recent_history=history,
        business_context=biz_ctx,
        collected_data=collected,
        customer_history=cust_hist,
    )
    await bot_responder.handle_result(result, conv.channel_identifier, conv.contact, conv, context, db)
