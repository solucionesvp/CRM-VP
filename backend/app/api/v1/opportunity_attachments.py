"""
Router: adjuntos de oportunidades.

Endpoints:
  POST   /opportunities/{opp_id}/attachments        — sube un archivo
  GET    /opportunities/{opp_id}/attachments        — lista adjuntos
  DELETE /opportunities/{opp_id}/attachments/{att_id} — elimina adjunto
"""
import uuid
import logging
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.opportunity import Opportunity
from app.models.opportunity_attachment import OpportunityAttachment
from app.schemas.opportunity_attachment import OpportunityAttachmentResponse
from app.services import storage_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/opportunities", tags=["opportunity-attachments"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _get_opportunity_or_404(opp_id: uuid.UUID, db: Session) -> Opportunity:
    opp = db.query(Opportunity).filter(
        Opportunity.id == opp_id,
        Opportunity.deleted_at.is_(None),
    ).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")
    return opp


# ── POST /opportunities/{opp_id}/attachments ─────────────────────────────────

@router.post(
    "/{opp_id}/attachments",
    response_model=OpportunityAttachmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_attachment(
    opp_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Sube un archivo adjunto y lo asocia a la oportunidad."""
    _get_opportunity_or_404(opp_id, db)

    file_bytes = await file.read()
    content_type = file.content_type or "application/octet-stream"
    unique_id = uuid.uuid4()
    file_key = f"opp-attachments/{opp_id}/{unique_id}_{file.filename}"

    file_url = await storage_service.upload_file(
        file_bytes=file_bytes,
        key=file_key,
        content_type=content_type,
    )

    if not file_url:
        # Si R2 no está configurado, construir URL pública de todas formas
        file_url = storage_service.get_public_url(file_key)

    attachment = OpportunityAttachment(
        id=unique_id,
        opportunity_id=opp_id,
        filename=file.filename or "archivo",
        file_key=file_key,
        file_url=file_url,
        content_type=content_type,
        file_size=len(file_bytes),
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    logger.info(f"Adjunto subido: {file_key} → oportunidad {opp_id}")
    return attachment


# ── GET /opportunities/{opp_id}/attachments ──────────────────────────────────

@router.get(
    "/{opp_id}/attachments",
    response_model=List[OpportunityAttachmentResponse],
)
def list_attachments(
    opp_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Lista todos los adjuntos de una oportunidad."""
    _get_opportunity_or_404(opp_id, db)

    attachments = (
        db.query(OpportunityAttachment)
        .filter(OpportunityAttachment.opportunity_id == opp_id)
        .order_by(OpportunityAttachment.created_at.asc())
        .all()
    )
    return attachments


# ── DELETE /opportunities/{opp_id}/attachments/{att_id} ──────────────────────

@router.delete(
    "/{opp_id}/attachments/{att_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_attachment(
    opp_id: uuid.UUID,
    att_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Elimina un adjunto de la oportunidad (solo registro en BD; no borra en R2)."""
    _get_opportunity_or_404(opp_id, db)

    attachment = db.query(OpportunityAttachment).filter(
        OpportunityAttachment.id == att_id,
        OpportunityAttachment.opportunity_id == opp_id,
    ).first()

    if not attachment:
        raise HTTPException(status_code=404, detail="Adjunto no encontrado")

    db.delete(attachment)
    db.commit()
    logger.info(f"Adjunto eliminado: {att_id}")
