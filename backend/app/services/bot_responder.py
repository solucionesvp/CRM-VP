"""
Respuestas del bot: formateo de contexto empresarial, persistencia de
mensajes outbound, escalamiento al agente humano y captura progresiva
de datos en ConversationContext.

No llama a OpenAI directamente.
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.conversation_context import ConversationContext
from app.models.message import Message
from app.models.enums import MessageDirection, MessageSenderType, MessageType, MessageStatus
from app.services import whatsapp_service, department_agent_service
from app.services.ai_classifier_service import ClassificationResult

logger = logging.getLogger(__name__)

# Mapa intención → depto real. Cualquier intent fuera del mapa
# (escalate_human, queja, unknown, etc.) va a DEFAULT_DEPT.
INTENT_TO_DEPT = {
    "sales":   "ventas",
    "service": "servicio_refacciones",
    "parts":   "servicio_refacciones",
    "admin":   "administracion",
}
DEFAULT_DEPT = "atencion_cliente"   # fallback obligatorio para todo lo no mapeado

ESCALATION_MSG = (
    "Para darte una respuesta precisa, voy a pasar tu caso con una persona del equipo. "
    "Ya le dejo el contexto para que no tengas que repetir todo. 🤝"
)

MENU_BUTTONS = [
    {"id": "select_sales",   "title": "🔧 Ventas de equipo"},
    {"id": "select_service", "title": "🛠️ Taller y servicio"},
    {"id": "select_parts",   "title": "⚙️ Refacciones"},
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _format_business_hours(hours: dict) -> str:
    """Agrupa dias consecutivos con mismo horario en texto legible."""
    if not hours:
        return ""
    dia_orden = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    dia_es = {"monday": "Lunes", "tuesday": "Martes", "wednesday": "Miercoles",
              "thursday": "Jueves", "friday": "Viernes", "saturday": "Sabado", "sunday": "Domingo"}
    grupos = []
    for dia in dia_orden:
        info = hours.get(dia) or {}
        closed = info.get("closed", False)
        clave = "cerrado" if closed else f"{info.get('open')}-{info.get('close')}"
        if grupos and grupos[-1]["clave"] == clave:
            grupos[-1]["dias"].append(dia)
        else:
            grupos.append({"clave": clave, "dias": [dia]})
    partes = []
    for g in grupos:
        dias = g["dias"]
        etiqueta = dia_es[dias[0]] if len(dias) == 1 else f"{dia_es[dias[0]]} a {dia_es[dias[-1]]}"
        if g["clave"] == "cerrado":
            partes.append(f"{etiqueta}: cerrado")
        else:
            partes.append(f"{etiqueta}: {g['clave']}")
    return ", ".join(partes)


def build_business_context(info) -> str:
    """Formatea BusinessInfo como texto plano completo para el system prompt."""
    if not info:
        return "Informacion del negocio no disponible aun."
    partes = [f"Empresa: {info.name}"]
    if info.description:
        partes.append(f"Descripcion: {info.description}")
    if info.address:
        ubicacion = info.address
        if info.city:
            ubicacion += f", {info.city}"
        if info.state:
            ubicacion += f", {info.state}"
        if info.postal_code:
            ubicacion += f", CP {info.postal_code}"
        partes.append(f"Direccion: {ubicacion}")
    elif info.city:
        partes.append(f"Ubicacion: {info.city}{', ' + info.state if info.state else ''}")
    if info.google_maps_url:
        partes.append(f"Link de Maps: {info.google_maps_url}")
    if info.business_hours:
        horario = _format_business_hours(info.business_hours)
        if horario:
            partes.append(f"Horario: {horario}")
    if info.phone:
        partes.append(f"Telefono: {info.phone}")
    if info.telefono_oficina:
        partes.append(f"Telefono oficina: {info.telefono_oficina}")
    if info.whatsapp_number:
        partes.append(f"WhatsApp: {info.whatsapp_number}")
    if info.website:
        partes.append(f"Web: {info.website}")
    if info.areas_served:
        areas = ", ".join(info.areas_served) if isinstance(info.areas_served, list) else str(info.areas_served)
        partes.append(f"Areas de servicio: {areas}")
    if info.formas_pago:
        partes.append(f"Formas de pago: {info.formas_pago}")
    if info.tiempos_entrega:
        partes.append(f"Tiempos de entrega: {info.tiempos_entrega}")
    if info.politica_cambios_devoluciones:
        partes.append(f"Politica de cambios/devoluciones: {info.politica_cambios_devoluciones}")
    if info.requisitos_cotizacion:
        partes.append(f"Requisitos para cotizar: {info.requisitos_cotizacion}")
    return "\n".join(partes)


def save_bot_message(db: Session, conversation: Conversation, text: str) -> Message:
    msg = Message(
        conversation_id=conversation.id,
        direction=MessageDirection.OUTBOUND,
        sender_type=MessageSenderType.BOT,
        message_type=MessageType.TEXT,
        content=text,
        status=MessageStatus.SENT,
    )
    db.add(msg)
    conversation.last_message_preview = text[:100]
    db.commit()
    return msg


def do_escalate(
    db: Session,
    conversation: Conversation,
    context: ConversationContext,
    dept_slug: str,
    summary: Optional[str],
) -> None:
    """Asigna agente via round-robin, marca handoff y guarda resumen."""
    department_agent_service.auto_assign_conversation(db, conversation.id, dept_slug)
    context.handoff_to_human = True
    context.handoff_reason   = "escalated_by_bot"
    if summary:
        context.handoff_summary = summary
    db.commit()


def _merge_collected(context: ConversationContext, extracted: dict, db: Session) -> None:
    """Escribe campos extraídos en collected_data solo si no existían antes."""
    current = dict(context.collected_data or {})
    updated = {k: v for k, v in extracted.items() if v and k not in current}
    if updated:
        context.collected_data = {**current, **updated}
        db.commit()


# ── Dispatcher principal ───────────────────────────────────────────────────────

async def handle_result(
    result: ClassificationResult,
    phone: str,
    contact,
    conversation: Conversation,
    context: ConversationContext,
    db: Session,
) -> None:
    """Despacha acción según resultado del clasificador."""

    # 1. Captura progresiva — siempre, independiente de la intención
    if result.extracted:
        _merge_collected(context, result.extracted, db)
        nombre = result.extracted.get("nombre")
        if nombre and contact.name.startswith("WhatsApp "):
            contact.name = nombre
            db.commit()

    # 2. Escalamiento — si la IA lo decide O la intención es explícitamente humano
    if result.should_escalate or result.intent == "escalate_human":
        dept_slug = (
            result.escalate_dept_slug                  # la IA sugiere uno
            or INTENT_TO_DEPT.get(result.intent)       # mapeado por intent
            or DEFAULT_DEPT                            # fallback a atencion_cliente
        )
        await whatsapp_service.send_text_message(to=phone, message=ESCALATION_MSG)
        save_bot_message(db, conversation, ESCALATION_MSG)
        do_escalate(db, conversation, context, dept_slug, result.handoff_summary)
        return

    # 3. Respuesta normal — usar sugerencia de la IA o menú por defecto
    response = result.suggested_response
    if response:
        await whatsapp_service.send_text_message(to=phone, message=response)
        save_bot_message(db, conversation, response)
    else:
        body = "¡Hola! Soy Armando 😊 ¿En qué te puedo ayudar?"
        await whatsapp_service.send_interactive_message(to=phone, body=body, buttons=MENU_BUTTONS)
        save_bot_message(db, conversation, body)

    # 4. Actualizar estado del flujo en contexto
    context.current_intent  = result.intent
    context.current_flow    = INTENT_TO_DEPT.get(result.intent, result.intent)
    context.last_bot_action = f"ai_response_{result.intent}"
    db.commit()
