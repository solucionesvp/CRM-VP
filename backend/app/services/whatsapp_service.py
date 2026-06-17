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
    """Envía mensaje via Evolution API"""
    from app.core.config import settings
    url = f"{settings.EVOLUTION_API_URL}/message/sendText/{settings.EVOLUTION_INSTANCE}"
    headers = {
        "apikey": settings.EVOLUTION_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {"number": to, "text": message}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        return response.json()


async def send_interactive_message(to: str, body: str, buttons: list) -> dict:
    """
    Evolution API no tiene botones interactivos nativos en Baileys.
    Envía como mensaje de texto con opciones numeradas.
    """
    options_text = "\n".join([f"{i+1}. {btn['title']}" for i, btn in enumerate(buttons)])
    full_message = f"{body}\n\n{options_text}"
    return await send_text_message(to, full_message)


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


async def get_connection_status() -> str:
    """
    Obtiene el estado de conexión de la instancia de Evolution API.
    Regresa el campo 'state' (open/close/connecting).
    """
    url = f"{settings.EVOLUTION_API_URL}/instance/connectionState/{settings.EVOLUTION_INSTANCE}"
    headers = {
        "apikey": settings.EVOLUTION_API_KEY,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.get(url, headers=headers)
            if response.status_code != 200:
                return "close"
            data = response.json()
            if isinstance(data, dict):
                instance_data = data.get("instance")
                if isinstance(instance_data, dict):
                    return instance_data.get("state", "close")
                return data.get("state", "close")
            return "close"
        except Exception:
            return "close"


async def request_pairing_code(phone_number: str) -> str:
    """
    Solicita un código de vinculación para conectar un número de teléfono.
    Regresa el código de vinculación obtenido.
    """
    url = f"{settings.EVOLUTION_API_URL}/instance/connect/{settings.EVOLUTION_INSTANCE}"
    headers = {
        "apikey": settings.EVOLUTION_API_KEY,
    }
    params = {"number": phone_number}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url, params=params, headers=headers)
        if response.status_code not in (200, 201):
            try:
                err_detail = response.json().get("message", "Error al conectar")
            except Exception:
                err_detail = response.text
            raise Exception(f"Error de Evolution API ({response.status_code}): {err_detail}")
        
        data = response.json()
        code = data.get("pairingCode") or data.get("code")
        if not code:
            raise Exception("No se encontró el código de vinculación en la respuesta")
        return code
