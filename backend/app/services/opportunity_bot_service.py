"""
Servicio de creación y vinculación automática de oportunidades por el bot.

Responsabilidad única: decidir si crear oportunidad nueva o reutilizar una
existente, y vincularla al campo conversation.opportunity_id.

NO toca WhatsApp ni respuestas al cliente.
Toda excepción queda atrapada con logger.warning para no romper el flujo.
"""
import json
import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.conversation import Conversation
from app.schemas.opportunity import OpportunityCreate
from app.services import bot_db_helpers as db_h
from app.services import opportunity_service

logger = logging.getLogger(__name__)

# ── Mapas de decisión (IDs confirmados en diagnóstico de producción) ───────────

# Solo estos 5 intents crean oportunidad. Todos los demás: no hacer nada.
PIPELINE_FOR_INTENT: dict = {
    "sales":       1,
    "quotation":   1,
    "service":     2,
    "appointment": 2,
    "parts":       3,
}

# Primera etapa activa de cada pipeline (IDs confirmados en diagnóstico SQL).
# pipeline_id → stage_id (order=1, is_active=True)
FIRST_STAGE_FOR_PIPELINE: dict = {
    1: 1,    # Nuevo interés
    2: 8,    # Recibido
    3: 14,   # Solicitud
}


# ── LLM match — segunda llamada ligera a OpenAI ────────────────────────────────

async def _ask_llm_match(producto: str, oportunidades: list) -> dict:
    """Pregunta al LLM si el producto nuevo coincide con alguna oportunidad existente.

    Retorna {"action": "reuse", "opportunity_id": "<uuid>"} o {"action": "create"}.
    Cualquier excepción → {"action": "create"} por defecto.
    """
    if not settings.OPENAI_API_KEY:
        return {"action": "create"}

    prompt = (
        f"El cliente mencionó que necesita: '{producto}'.\n"
        f"Estas son sus oportunidades activas en el CRM:\n"
        f"{json.dumps(oportunidades, ensure_ascii=False, indent=2)}\n\n"
        f"¿El producto que menciona el cliente es esencialmente el mismo que alguna "
        f"de estas oportunidades (mismo tipo de equipo o servicio, aunque las palabras "
        f"difieran un poco)?\n\n"
        f"Responde SOLO con JSON válido, sin texto adicional, sin markdown:\n"
        f"Si es el mismo: {{\"action\": \"reuse\", \"opportunity_id\": \"<uuid exacto>\"}}\n"
        f"Si es diferente o no estás seguro: {{\"action\": \"create\"}}"
    )

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_completion_tokens=100,
            temperature=0,
        )
        raw = response.choices[0].message.content or ""
        return json.loads(raw.strip())
    except Exception as exc:
        logger.warning(f"opportunity_bot_service._ask_llm_match falló: {exc}")
        return {"action": "create"}


# ── Función principal ──────────────────────────────────────────────────────────

async def decide_and_link_opportunity(
    db: Session,
    conversation: Conversation,
    contact,
    intent: str,
    collected_data: dict,
) -> None:
    """Decide si crear oportunidad nueva o reutilizar existente, y vincula a la conversación.

    Guardas:
    1. Intent fuera de PIPELINE_FOR_INTENT → return (no aplica).
    2. Conversación ya tiene opportunity_id → return (Kanban se encarga).
    3. Sin producto capturado → return (esperar más contexto).

    Fallo total → logger.warning, nunca propaga excepción.
    """
    try:
        # Guarda 1 — intent no crea oportunidad
        if intent not in PIPELINE_FOR_INTENT:
            return

        # Guarda 2 — ya vinculada
        if conversation.opportunity_id is not None:
            return

        # Guarda 3 — sin producto todavía
        producto = (collected_data.get("producto") or "").strip()
        if not producto:
            return

        pipeline_id = PIPELINE_FOR_INTENT[intent]

        # Consultar oportunidades activas del contacto
        activas = db_h.get_active_opportunities_for_contact(db, contact.id)

        if activas:
            # Segunda llamada al LLM para decidir reuse vs create
            decision = await _ask_llm_match(producto, activas)

            if decision.get("action") == "reuse":
                opp_id_str = decision.get("opportunity_id", "")
                try:
                    opp_uuid = UUID(opp_id_str)
                    conversation.opportunity_id = opp_uuid
                    db.commit()
                    logger.info(
                        f"Oportunidad existente reutilizada por bot: {opp_uuid} "
                        f"para conversación {conversation.id}"
                    )
                    return
                except (ValueError, AttributeError) as exc:
                    logger.warning(
                        f"opportunity_bot_service: UUID inválido en respuesta LLM "
                        f"'{opp_id_str}' — {exc}. Creando oportunidad nueva."
                    )
                    # cae al paso 8 (crear nueva)

        # Paso 8 — Crear oportunidad nueva
        title = f"WhatsApp — {producto.capitalize()}"
        stage_id = FIRST_STAGE_FOR_PIPELINE[pipeline_id]

        nueva_opp = opportunity_service.create_opportunity(
            db,
            OpportunityCreate(
                contact_id=contact.id,
                title=title,
                product_interest=producto,
                stage_id=stage_id,
                pipeline_id=pipeline_id,
                source="whatsapp_bot",
            ),
        )

        conversation.opportunity_id = nueva_opp.id
        db.commit()
        logger.info(
            f"Oportunidad creada por bot: {nueva_opp.id} — {title} "
            f"(pipeline={pipeline_id}, stage={stage_id})"
        )

    except Exception as exc:
        logger.warning(
            f"opportunity_bot_service.decide_and_link_opportunity: "
            f"error no fatal para conversación {conversation.id} — {exc}"
        )
