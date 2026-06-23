"""
Servicio de descarga y almacenamiento de media de WhatsApp.

Responsabilidad única: descargar archivos de Evolution API y subirlos a R2.
Si falla en cualquier punto retorna dict vacío sin propagar la excepción,
para no bloquear el flujo del bot.
"""
import base64
import logging

import httpx

from app.core.config import settings
from app.services import storage_service

logger = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _mime_to_ext(mime: str) -> str:
    """Convierte mimetype a extensión de archivo (con punto)."""
    MAP = {
        "image/jpeg":   ".jpg",
        "image/png":    ".png",
        "image/webp":   ".webp",
        "image/gif":    ".gif",
        "audio/ogg":    ".ogg",
        "audio/mpeg":   ".mp3",
        "audio/mp4":    ".m4a",
        "video/mp4":    ".mp4",
        "video/3gpp":   ".3gp",
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    }
    return MAP.get(mime, "")


# ── Función principal ──────────────────────────────────────────────────────────

async def download_and_store_media(
    message_id: str,
    media_type: str,
    conversation_id: str,
    mime_type: str = "",
    filename: str = "",
) -> dict:
    """
    Descarga el archivo de Evolution API y lo sube a R2.

    Args:
        message_id:      external_id (wamid) del mensaje de WhatsApp.
        media_type:      "image" | "audio" | "video" | "document".
        conversation_id: ID de la conversación (str) — usado como carpeta en R2.
        mime_type:       MIME type hint (puede quedar vacío; se detecta del response).
        filename:        nombre de archivo hint (puede quedar vacío).

    Returns:
        dict con claves media_url, media_mime_type, media_filename, media_size_bytes.
        Dict vacío si falla en cualquier punto.
    """
    try:
        evo_url = (
            f"{settings.EVOLUTION_API_URL}/chat/getBase64FromMediaMessage"
            f"/{settings.EVOLUTION_INSTANCE}"
        )
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                evo_url,
                json={
                    "message": {"key": {"id": message_id}},
                    "convertToMp4": False,
                },
                headers={"apikey": settings.EVOLUTION_API_KEY},
            )
            if resp.status_code not in (200, 201):
                logger.warning(
                    f"media_service: Evolution getBase64 falló — "
                    f"status={resp.status_code} msg_id={message_id}"
                )
                return {}
            data = resp.json()

        base64_data = data.get("base64", "")
        if not base64_data:
            logger.warning(f"media_service: base64 vacío para msg_id={message_id}")
            return {}

        file_bytes = base64.b64decode(base64_data)

        # MIME y extensión
        detected_mime = data.get("mimetype") or mime_type or "application/octet-stream"
        ext = _mime_to_ext(detected_mime)
        safe_filename = filename or f"{media_type}_{message_id[:8]}{ext}"
        key = f"whatsapp/{conversation_id}/{message_id}{ext}"

        media_url = await storage_service.upload_file(file_bytes, key, detected_mime)

        return {
            "media_url":        media_url,
            "media_mime_type":  detected_mime,
            "media_filename":   safe_filename,
            "media_size_bytes": len(file_bytes),
        }

    except Exception as exc:
        logger.error(f"media_service.download_and_store_media error: {exc}", exc_info=True)
        return {}
