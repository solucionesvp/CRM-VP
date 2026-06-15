from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.conversation import (
    ConversationListItem, ConversationDetail, ConversationUpdate,
    ConversationAssign, MessageResponse, SendMessageRequest,
    CreateOpportunityRequest,
)
from app.services import conversation_service

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
    try:
        msg = await conversation_service.send_message(db, conv_id, body.text)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    return msg


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
