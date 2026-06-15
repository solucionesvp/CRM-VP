import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.services import bot_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bot", tags=["bot"])


@router.get("/webhook")
def verify_webhook(
    hub_mode: str         = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str    = Query(None, alias="hub.challenge"),
):
    """
    Meta llama este endpoint una vez para verificar el webhook.
    Si el token coincide, responde con hub.challenge (texto plano).
    """
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge)
    raise HTTPException(status_code=403, detail="Token de verificación inválido")


@router.post("/webhook")
async def receive_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Meta llama este endpoint con cada mensaje entrante.
    Responde 200 inmediatamente; el procesamiento ocurre en background.
    """
    payload = await request.json()
    # Log para debug
    logger.info(f"WEBHOOK PAYLOAD: {json.dumps(payload, ensure_ascii=False)[:500]}")
    background_tasks.add_task(bot_engine.process_webhook, payload, db)
    return {"status": "ok"}
