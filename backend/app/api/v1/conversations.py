from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.message import Message
from app.models.enums import MessageDirection, MessageSenderType, MessageType, MessageStatus
from app.schemas.conversation import (
    ConversationListItem, ConversationDetail, ConversationUpdate,
    ConversationAssign, MessageResponse, SendMessageRequest,
    CreateOpportunityRequest,
)
from app.services import conversation_service, storage_service, whatsapp_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.get("/", response_model=List[ConversationListItem])
def list_conversations(
    status: Optional[str] = None,
    assigned_department: Optional[str] = None,
    bot_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(30, le=100),
    db: Session = Depends(get_db),
):
    items, _ = conversation_service.list_conversations(
        db, status=status, assigned_department=assigned_department,
        bot_active=bot_active, search=search, page=page, size=size,
    )
    # Attach last_message to each
    result = []
    for conv in items:
        last_msg = conversation_service.get_last_message(db, conv.id)
        item = ConversationListItem.model_validate(conv)
        item.last_message = MessageResponse.model_validate(last_msg) if last_msg else None
        result.append(item)
    return result


@router.get("/{conv_id}", response_model=ConversationDetail)
def get_conversation(conv_id: UUID, db: Session = Depends(get_db)):
    conv = conversation_service.get_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")
    return conv


@router.get("/{conv_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conv_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(100, le=200),
    db: Session = Depends(get_db),
):
    conv = conversation_service.get_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")
    return conversation_service.get_messages(db, conv_id, page=page, size=size)


@router.post("/{conv_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(conv_id: UUID, body: SendMessageRequest, db: Session = Depends(get_db)):
    from app.models.conversation import Conversation
    from app.models.user import User

    conversation = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")

    signature = "*Equipo VP*"
    if conversation.assigned_to_user_id:
        user = db.query(User).filter(User.id == conversation.assigned_to_user_id).first()
        if user and user.name:
            first_name = user.name.strip().split(" ")[0]
            dept = conversation.assigned_department
            if dept:
                signature = f"*{first_name} · {dept.replace('_', ' ').title()}*"
            else:
                signature = f"*{first_name}*"

    signed_text = f"{signature}\n{body.text}"

    try:
        msg = await conversation_service.send_message(db, conv_id, signed_text)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return msg


@router.post("/{conv_id}/messages/media", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_media(
    conv_id: UUID,
    file: UploadFile = File(...),
    caption: str = "",
    db: Session = Depends(get_db),
):
    """
    Sube un archivo a R2 y lo envía como mensaje multimedia de WhatsApp.
    Acepta multipart/form-data con campos: file (requerido), caption (opcional).
    """
    from app.models.conversation import Conversation

    # 1. Cargar conversación
    conversation = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")

    # 2. Leer bytes
    content = await file.read()

    # 3. Detectar MIME
    mime_type = file.content_type or "application/octet-stream"

    # 4. Detectar media_type
    if mime_type.startswith("image/"):
        media_type = "image"
    elif mime_type.startswith("video/"):
        media_type = "video"
    elif mime_type.startswith("audio/"):
        media_type = "audio"
    elif mime_type in (
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.ms-excel",
    ) or mime_type.startswith("application/vnd."):
        media_type = "document"
    else:
        media_type = "document"

    # 5. Construir key R2
    prefix = uuid4().hex[:8]
    key = f"outbound/{conv_id}/{prefix}_{file.filename}"

    # 6. Subir a R2
    media_url = await storage_service.upload_file(content, key, mime_type)
    if not media_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo subir el archivo — R2 no configurado o error de conexión",
        )

    # 7. Enviar por WhatsApp
    await whatsapp_service.send_media_message(
        to=conversation.channel_identifier,
        media_url=media_url,
        media_type=media_type,
        mime_type=mime_type,
        filename=file.filename or "",
        caption=caption,
    )

    # 8. Detectar MessageType — usa IMAGE/VIDEO/AUDIO/DOCUMENT si el enum los tiene, sino SYSTEM
    try:
        mtype = MessageType[media_type.upper()]
    except KeyError:
        mtype = MessageType.SYSTEM

    msg = Message(
        conversation_id=conv_id,
        direction=MessageDirection.OUTBOUND,
        sender_type=MessageSenderType.HUMAN,
        message_type=mtype,
        content=caption or file.filename,
        media_url=media_url,
        media_mime_type=mime_type,
        media_filename=file.filename,
        media_size_bytes=len(content),
        status=MessageStatus.SENT,
    )
    db.add(msg)
    conversation.last_message_preview = f"📎 {file.filename}"
    conversation.last_message_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)

    # 9. Retornar
    return MessageResponse.model_validate(msg)


@router.patch("/{conv_id}", response_model=ConversationDetail)
def update_conversation(conv_id: UUID, data: ConversationUpdate, db: Session = Depends(get_db)):
    conv = conversation_service.update_conversation(
        db, conv_id, data.model_dump(exclude_unset=True)
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")
    return conv


@router.patch("/{conv_id}/assign", response_model=ConversationDetail)
def assign_conversation(conv_id: UUID, body: ConversationAssign, db: Session = Depends(get_db)):
    conv = conversation_service.assign_conversation(
        db, conv_id, department=body.department, user_id=body.user_id
    )
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversación no encontrada")
    return conv


@router.post("/{conv_id}/opportunities", status_code=status.HTTP_201_CREATED)
def create_opportunity(conv_id: UUID, body: CreateOpportunityRequest, db: Session = Depends(get_db)):
    try:
        opp = conversation_service.create_opportunity_for_conversation(
            db, conv_id, body.pipeline_id, body.title, body.product_interest
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return {"id": str(opp.id), "title": opp.title}
