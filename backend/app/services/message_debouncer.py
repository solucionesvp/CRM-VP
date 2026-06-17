"""
Debouncer de mensajes por conversación.

Mantiene un dict en memoria {str(conversation_id): asyncio.Task}.
Cada mensaje nuevo cancela el timer anterior y programa uno nuevo.
Cuando el timer expira sin interrupción, ejecuta el callback.

Limitación aceptada: estado en memoria. Si el servidor se reinicia
durante la ventana de espera, ese mensaje pendiente se pierde.
Válido mientras corra en una sola instancia. Para múltiples instancias
se requeriría una cola persistente (ej. Redis Streams) — fuera de scope.
"""
import asyncio
import logging
from typing import Awaitable, Callable
from uuid import UUID

logger = logging.getLogger(__name__)

# {str(conversation_id): asyncio.Task}
_pending: dict[str, asyncio.Task] = {}


async def schedule(
    conversation_id: UUID,
    callback: Callable[[], Awaitable[None]],
    delay: float,
) -> None:
    """
    Cancela el timer activo de esta conversación (si existe) y programa uno nuevo.
    Cuando expira sin interrupción, llama a callback().
    El webhook regresa {"status":"ok"} inmediatamente — el callback corre en background.
    """
    key = str(conversation_id)

    existing = _pending.get(key)
    if existing and not existing.done():
        existing.cancel()
        logger.debug(f"Debounce re-armado: conv {key[:8]}…")

    async def _fire():
        try:
            try:
                await asyncio.sleep(delay)
            except asyncio.CancelledError:
                return   # otro mensaje llegó antes — este timer fue cancelado

            _pending.pop(key, None)
            logger.info(f"Timer de debounce disparado para conversación {key[:8]}... — procesando mensajes acumulados")
            await callback()
        except Exception:
            logger.exception(f"Error en ejecución de la tarea de debounce para conversación {key[:8]}...")

    _pending[key] = asyncio.create_task(_fire())


def cancel(conversation_id: UUID) -> None:
    """Cancela el timer pendiente de esta conversación, si existe."""
    key = str(conversation_id)
    task = _pending.pop(key, None)
    if task and not task.done():
        task.cancel()
        logger.debug(f"Debounce cancelado manualmente: conv {key[:8]}…")


def active_count() -> int:
    """Conversaciones con timer activo — útil para monitoreo/health check."""
    return sum(1 for t in _pending.values() if not t.done())
