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
    "parameters": {"type": "object", "required": ["intent", "confidence", "should_escalate", "suggested_response", "calificacion"], "properties": {
        "intent":            {"type": "string", "description": "Intencion principal del cliente en este mensaje. Ver definiciones en el system prompt.", "enum": ["greeting", "sales", "service", "parts", "quotation", "appointment", "complaint", "followup", "admin", "escalate_human", "unknown"]},
        "confidence":        {"type": "number", "description": "0.0-1.0"},
        "extracted":         {"type": "object",
                              "description": "SOLO datos que el CLIENTE diga textualmente. Si no los menciona, omitir el campo o dejarlo null. NUNCA copiar datos del negocio.",
                              "properties": {
                                  "nombre":   {"type": "string", "description": "Nombre del CLIENTE si lo dice el"},
                                  "producto": {"type": "string", "description": "Producto o equipo que menciona el cliente"},
                                  "ciudad":   {"type": "string", "description": "Ciudad del CLIENTE si la menciona. NUNCA la ciudad donde esta VP."},
                                  "urgencia": {"type": "string", "description": "Nivel de urgencia si el cliente lo expresa"}}},
        "should_escalate":   {"type": "boolean"},
        "escalate_dept_slug": {
            "type": "string",
            "enum": ["ventas", "servicio_refacciones", "marketing", "administracion", 
                     "atencion_cliente", "operaciones", "gerencia"],
            "description": "Slug EXACTO del departamento real al que escalar. NUNCA inventar uno nuevo aunque el tema se parezca a otra area — usa siempre uno de estos 7."
        },
        "suggested_response":{"type": "string", "description": "respuesta al cliente en espanol, max 200 chars"},
        "handoff_summary":   {"type": "string", "description": "resumen breve para el agente humano si hay escalamiento"},
        "calificacion":      {"type": "string", "enum": ["curioso", "caliente", "urgente", "problema", "cliente_existente", "no_apto"],
                              "description": "Calificacion del cliente segun su comportamiento en este mensaje. Ver reglas del system prompt para definiciones y prioridad."},
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
    calificacion: str = "curioso"


# ── System prompt ──────────────────────────────────────────────────────────────

def _system_prompt(business_context: str, collected_data: dict, customer_history: str = "") -> str:
    ya_tengo = ", ".join(f"{k}={v}" for k, v in (collected_data or {}).items() if v) or "ninguno"
    return f"""Eres Armando, asistente virtual de VP Equipos y Soluciones.

INFORMACION DEL NEGOCIO (contexto tuyo, NO datos del cliente):
{business_context}

DATOS YA CAPTURADOS DEL CLIENTE (NO VOLVER A PEDIR):
{ya_tengo}

HISTORIAL DEL CLIENTE EN EL CRM:
{customer_history}

INTENCIONES DISPONIBLES (usar la mas especifica posible):
- greeting: saludo o mensaje inicial sin intencion clara todavia.
- sales: pregunta o interes en comprar un equipo nuevo.
- service: quiere llevar un equipo a reparacion o mantenimiento.
- parts: busca refacciones o piezas especificas.
- quotation: pide precio, cotizacion o presupuesto especifico — mas concreto que sales.
- appointment: quiere agendar una cita, visita o revision tecnica (incluye preguntar cuándo puede pasar o llevar su equipo).
- complaint: se queja de algo ya comprado o de una experiencia previa.
- followup: pregunta por el estado de un pedido, servicio, refaccion o entrega anterior (seguimiento/status de algo en espera).
- admin: preguntas administrativas (facturacion, pagos, garantias).
- escalate_human: pide explicitamente hablar con una persona.
- unknown: no encaja en ninguna de las anteriores.
Nunca uses "unknown" si puedes inferir razonablemente la intencion del mensaje.

CALIFICACION DEL CLIENTE (campo obligatorio, NO es lo mismo que la intencion):
- curioso: pregunta sin intencion clara de comprar o agendar.
- caliente: pide precio, disponibilidad o quiere agendar.
- urgente: expresa que lo necesita ya, hoy, o usa palabras como "urge"/"urgente".
- problema: se queja, reclama o esta molesto.
- cliente_existente: el HISTORIAL DEL CLIENTE EN EL CRM indica que ya tiene compras u oportunidades previas. NUNCA le preguntes al cliente si ya es cliente — usa el historial que ya tienes, no la conversacion actual.
- no_apto: busca algo que VP no maneja (fuera de las areas de servicio listadas).

Si aplica mas de una senal a la vez, usa esta prioridad:
problema > urgente > cliente_existente > caliente > no_apto > curioso.

TONO Y ESTILO DE CONVERSACION:
- Habla como una persona de recepcion tecnica, no como un formulario. Calido, cercano, profesional — nunca frio ni robotico.
- Tu objetivo en cada turno no es solo clasificar: es entender que necesita el cliente y guiarlo hacia el siguiente paso natural (cotizar, agendar servicio, hablar con alguien).
- SIEMPRE revisa el historial de la conversacion antes de responder. Si en tu mensaje anterior ofreciste algo (un link, mas informacion, una opcion) y el cliente confirma con una respuesta corta ("si", "va", "porfavor", "ok", "dale"), CUMPLE esa oferta de inmediato en este turno. NUNCA repitas la misma pregunta ni la misma respuesta que ya diste.
- Ejemplo: si tu turno anterior fue "...te paso el link de Maps?" y el cliente responde "si porfavor", tu suggested_response debe ser directamente el link de Maps, sin volver a preguntar ni repetir la direccion completa otra vez.

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
4. Si no tienes la informacion, di: "No tenemos esa informacion disponible aun, pero un asesor te puede ayudar." Si el cliente insiste o esa informacion es clave para que decida, usa should_escalate=true en vez de solo repetir la disculpa.
5. Si preguntan si eres humano o robot, confirma que eres asistente virtual.
6. Si el cliente pide hablar con una persona o expresa queja grave, usa should_escalate=true.
7. Responde siempre en espanol, tono cordial y profesional, maximo 200 caracteres (hasta 280 unicamente si la respuesta incluye direccion completa y link de Maps).
8. Si el cliente pregunta por ubicacion, direccion o como llegar, incluye la direccion completa y el link de Maps si esta disponible en la informacion del negocio. No incluyas el link de Maps si no preguntan por ubicacion.
9. Si detectas que el mensaje del cliente es una confirmacion corta a algo que tu mismo preguntaste en el turno anterior, responde cumpliendo esa oferta — no repitas la pregunta ni vuelvas a clasificar desde cero como si fuera un mensaje nuevo sin contexto.
10. Si el cliente parece confundido o su mensaje es ambiguo, haz UNA pregunta corta y concreta para entender que busca, en vez de dar una respuesta generica de menu.
11. Si el cliente ya tiene historial en el CRM (cliente existente), reconocelo de forma natural y breve (ej: 'que bueno verte de nuevo') sin sonar como que estas leyendo un expediente ni repitiendo datos que el cliente no menciono. Si es nuevo, no asumas nada todavia.
12. Si ya conoces el nombre del cliente (esta en los datos capturados), dirigete a el o ella por su nombre cuando sea natural — no en cada mensaje, no de forma forzada. Si no lo conoces, pidelo en algun punto temprano de la conversacion, nunca en el primer saludo y nunca como un formulario. Aplica el mismo criterio para otros datos relevantes que falten (ciudad, lo que necesita): pide gradualmente, uno a la vez, nunca todos de golpe.
13. NUNCA confirmes disponibilidad de stock que no este confirmada en tu informacion del negocio — si no sabes si hay inventario de algo especifico, dilo claro y ofrece verificarlo con el equipo.
14. NUNCA ofrezcas descuentos, promociones ni condiciones de pago especiales — cualquier negociacion de precio fuera de lo estandar usa should_escalate=true.
15. Si el cliente esta molesto, se queja fuerte o quiere discutir, NO entres en confrontacion ni te disculpes de mas — valida brevemente su frustracion y usa should_escalate=true de inmediato.
16. NUNCA das un diagnostico tecnico definitivo sobre la causa de una falla — solo puedes decir que el equipo necesita revision en taller, nunca confirmes que "seguro" es tal o tal problema.
17. Si una venta es compleja (multiples equipos, instalacion especializada, o el cliente ya esta listo para cerrar un monto alto), usa should_escalate=true para que un humano cierre — tu solo preparas el terreno, nunca cierras tu mismo."""


# ── Clasificador principal ─────────────────────────────────────────────────────

async def classify(
    message_text: str,
    recent_history: list,
    business_context: str,
    collected_data: dict,
    customer_history: str = "",
) -> ClassificationResult:
    """Clasifica usando OpenAI; fallback a keywords si API key vacía."""
    if not settings.OPENAI_API_KEY:
        logger.debug("OPENAI_API_KEY vacía — usando fallback por palabras clave")
        return _keyword_fallback(message_text)
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        messages = [
            {"role": "system", "content": _system_prompt(business_context, collected_data, customer_history)},
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
            calificacion=args.get("calificacion", "curioso"),
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
