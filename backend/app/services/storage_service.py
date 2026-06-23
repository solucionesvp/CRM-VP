"""
Servicio de almacenamiento en Cloudflare R2 (S3-compatible).

Responsabilidad única: subir y construir URLs de archivos en R2.
Si las variables R2_* no están configuradas, todas las operaciones
retornan None silenciosamente (comportamiento correcto en local).
"""
import asyncio
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_r2_client():
    """
    Retorna cliente boto3 configurado para R2.
    Retorna None si faltan variables de entorno.
    """
    if not all([
        settings.R2_ACCESS_KEY_ID,
        settings.R2_SECRET_ACCESS_KEY,
        settings.R2_ACCOUNT_ID,
    ]):
        return None
    import boto3  # import tardío para no fallar si boto3 no está instalado aún
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
    )


async def upload_file(
    file_bytes: bytes,
    key: str,
    content_type: str,
) -> str | None:
    """
    Sube bytes a R2 y retorna la URL pública.

    Args:
        file_bytes:   contenido binario del archivo.
        key:          ruta dentro del bucket, ej: "whatsapp/conv_id/filename.jpg"
        content_type: MIME type, ej: "image/jpeg"

    Returns:
        URL pública completa, o None si R2 no está configurado o falla.
    """
    client = get_r2_client()
    if not client:
        logger.warning("R2 no configurado — archivo no subido")
        return None
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
            ),
        )
        url = f"{settings.R2_PUBLIC_URL}/{key}"
        logger.info(f"storage_service: archivo subido → {url}")
        return url
    except Exception as exc:
        logger.error(f"storage_service.upload_file error: {exc}")
        return None


def get_public_url(key: str) -> str:
    """Construye URL pública desde key sin necesidad de llamar a R2."""
    return f"{settings.R2_PUBLIC_URL}/{key}"
