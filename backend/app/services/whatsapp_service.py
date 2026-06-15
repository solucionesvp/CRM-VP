"""
Servicio de envío de mensajes via WhatsApp Cloud API (Meta).
"""
import httpx
from app.core.config import settings

_BASE_URL = "https://graph.facebook.com/v19.0"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }


def _messages_url() -> str:
    return f"{_BASE_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"


async def send_text_message(to: str, message: str) -> dict:
    """
    Envía texto simple via WhatsApp Cloud API.
    'to' en formato internacional sin '+': '5213114997717'
    """
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message},
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            _messages_url(), json=payload, headers=_headers(), timeout=10
        )
        return response.json()


async def send_interactive_message(to: str, body: str, buttons: list) -> dict:
    """
    Envía mensaje con botones interactivos (máximo 3).
    buttons = [{"id": "select_sales", "title": "Ventas"}, ...]
    """
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body},
            "action": {
                "buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
                    for b in buttons[:3]
                ]
            },
        },
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            _messages_url(), json=payload, headers=_headers(), timeout=10
        )
        return response.json()


async def send_message_evolution(phone: str, text: str) -> dict:
    """
    Envía mensaje via Evolution API (gateway WhatsApp activo).
    Usa settings.EVOLUTION_INSTANCE como instancia.
    """
    url = f"{settings.EVOLUTION_API_URL}/message/sendText/{settings.EVOLUTION_INSTANCE}"
    headers = {
        "apikey": settings.EVOLUTION_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {"number": phone, "text": text}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        return response.json()
