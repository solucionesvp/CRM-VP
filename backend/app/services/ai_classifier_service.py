"""
Clasificador de mensajes con OpenAI (function calling).
Responsabilidad única: llamar a la API y retornar ClassificationResult.
NO toca BD ni WhatsApp — solo lógica de IA.

Fallback a palabras clave si OPENAI_API_KEY está vacía.
"""
import json
import logging
from dataclasses import dataclass, field
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Fallback por palabras clave ────────────────────────────────────────────────
_SALES_KW   = {"venta", "equipo", "bomba", "generador", "comprar", "precio", "cotizar", "1"}
_SERVICE_KW = {"taller", "servicio", "reparar", "tecnico", "mantenimiento", "2"}
_PARTS_KW   = {"refaccion", "parte", "repuesto", "pieza", "refacciones", "3"}
_HUMAN_KW   = {"humano", "persona", "asesor", "agente", "quiero hablar", "hablar con"}

# ── Schema de la función OpenAI ────────────────────────────────────────────────
_CLASSIFY_TOOL = {"type": "function", "function": {
    "name": "classify",
    "description": "Clasifica el mensaje del cliente y extrae datos que el CLIENTE mencione explicitamente.",
    "parameters": {"type": "object", "required": ["intent", "confidence", "should_escalate", "suggested_response"], "properties": {
        "intent":            {"type": "string", "enum": ["greeting", "sales", "service", "parts", "admin", "escalate_human", "unknown"]},
        "confidence":        {"type": "number", "description": "0.0-1.0"},
        "extracted":         {"type": "object",
                              "description": "SOLO datos que el CLIENTE diga textualmente. Si no los menciona, omitir el campo o dejarlo null. NUNCA copiar datos del negocio.",
                              "properties": {
                                  "nombre":   {"type": "string", "description": "Nombre del CLIENTE si lo dice el"},
                                  "producto": {"type": "string", "description": "Producto o equipo que menciona el cliente"},
                                  "ciudad":   {"type": "string", "description": "Ciudad del CLIENTE si la menciona. NUNCA la ciudad donde esta VP."},
                                  "urgencia": {"type": "string", "description": "Nivel de urgencia si el cliente lo expresa"}}},
        "should_escalate":   {"type": "boolean"},
        "escalate_dept_slug":{"type": "string", "description": "slug del departamento al que escalar si should_escalate=true"},
        "suggested_response":{"type": "string", "description": "respuesta al cliente en espanol, max 200 chars"},
        "handoff_summary":   {"type": "string", "description": "resumen breve para el agente humano si hay escalamiento"},
    }},
}}


@dataclass
class ClassificationResult:
    intent: str
    confidence: float
    extracted: dict = field(default_factory=dict)
    should_escalate: bool = False
    escalate_dept_slug: Optional[str] = None
    suggested_response: Optional[str] = None
    handoff_summary: Optional[str] = None


# ── System prompt ──────────────────────────────────────────────────────────────

def _system_prompt(business_context: str, collected_data: dict) -> str:
    ya_tengo = ", ".join(f"{k}={v}" for k, v in (collected_data or {}).items() if v) or "ninguno"
    return f"""Eres Armando, asistente virtual de VP Equipos y Soluciones.

INFORMACION DEL NEGOCIO (contexto tuyo, NO datos del cliente):
{business_context}

DATOS YA CAPTURADOS DEL CLIENTE (NO VOLVER A PEDIR):
{ya_tengo}

REGLA CRITICA SOBRE EL CAMPO extracted:
- En "extracted" SOLO incluye informacion que el CLIENTE diga textualmente en SU mensaje.
- Si el cliente no menciona su nombre, ciudad, producto o urgencia → deja ese campo null/vacio.
- La informacion del negocio (ciudad de VP, telefono de VP, etc.) es contexto TUYO, no del cliente.
- "ciudad" en extracted = ciudad donde ESTA el cliente o su instalacion, si el cliente la menciona.
  NUNCA pongas la ciudad de VP como ciudad del cliente.

REGLAS NO NEGOCIABLES:
1. NUNCA inventes precios, descuentos ni condiciones comerciales.
2. NUNCA prometas fechas de entrega ni tiempos de servicio especificos.
3. NUNCA confirmes citas — el equipo las confirma directamente.
4. Si no tienes la informacion, di: "No tenemos esa informacion disponible aun, pero un asesor te puede ayudar."
5. Si preguntan si eres humano o robot, confirma que eres asistente virtual.
6. Si el cliente pide hablar con una persona o expresa queja grave, usa should_escalate=true.
7. Responde siempre en espanol, tono cordial y profesional, maximo 200 caracteres."""


# ── Clasificador principal ─────────────────────────────────────────────────────

async def classify(
    message_text: str,
    recent_history: list,
    business_context: str,
    collected_data: dict,
) -> ClassificationResult:
    """Clasifica usando OpenAI; fallback a keywords si API key vacía."""
    if not settings.OPENAI_API_KEY:
        logger.debug("OPENAI_API_KEY vacía — usando fallback por palabras clave")
        return _keyword_fallback(message_text)
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        messages = [
            {"role": "system", "content": _system_prompt(business_context, collected_data)},
            *recent_history,
            {"role": "user", "content": message_text},
        ]
        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=[_CLASSIFY_TOOL],
            tool_choice={"type": "function", "function": {"name": "classify"}},
            max_completion_tokens=500,
            temperature=0.3,
        )
        args = json.loads(resp.choices[0].message.tool_calls[0].function.arguments)
        return ClassificationResult(
            intent=args.get("intent", "unknown"),
            confidence=float(args.get("confidence", 0.5)),
            extracted=args.get("extracted") or {},
            should_escalate=bool(args.get("should_escalate", False)),
            escalate_dept_slug=args.get("escalate_dept_slug"),
            suggested_response=args.get("suggested_response"),
            handoff_summary=args.get("handoff_summary"),
        )
    except Exception as exc:
        logger.error(f"OpenAI classify error: {exc}", exc_info=True)
        return _keyword_fallback(message_text)


def _keyword_fallback(text: str) -> ClassificationResult:
    t = text.lower()
    words = set(t.split())
    if words & _HUMAN_KW or "quiero hablar" in t or "hablar con" in t:
        return ClassificationResult("escalate_human", 0.9, should_escalate=True)
    if words & _SALES_KW:
        return ClassificationResult("sales", 0.7, suggested_response="Con gusto te ayudo con ventas. ¿Qué equipo necesitas?")
    if words & _SERVICE_KW:
        return ClassificationResult("service", 0.7, suggested_response="Nuestro equipo técnico te atenderá. ¿Qué equipo requiere servicio?")
    if words & _PARTS_KW:
        return ClassificationResult("parts", 0.7, suggested_response="Te ayudamos con refacciones. ¿Qué pieza necesitas?")
    return ClassificationResult("greeting", 0.5, suggested_response="¡Hola! Soy Armando de VP Equipos. ¿En qué te puedo ayudar hoy?")
