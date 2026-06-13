from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.schemas.commercial import (
    QuickReplyCreate, QuickReplyUpdate, QuickReplyResponse,
    StageRuleCreate, StageRuleUpdate, StageRuleResponse
)
from app.services import commercial_service

router = APIRouter(tags=["commercial"])

# --- QUICK REPLY ENDPOINTS ---

@router.get("/quick-replies/", response_model=List[QuickReplyResponse])
def read_quick_replies(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return commercial_service.get_quick_replies(db, category=category, is_active=is_active)


@router.post("/quick-replies/", response_model=QuickReplyResponse, status_code=status.HTTP_201_CREATED)
def create_quick_reply(
    data: QuickReplyCreate,
    db: Session = Depends(get_db)
):
    return commercial_service.create_quick_reply(db, data)


@router.get("/quick-replies/{qr_id}", response_model=QuickReplyResponse)
def read_quick_reply(
    qr_id: int,
    db: Session = Depends(get_db)
):
    db_qr = commercial_service.get_quick_reply(db, qr_id)
    if not db_qr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Respuesta rápida no encontrada")
    return db_qr


@router.patch("/quick-replies/{qr_id}", response_model=QuickReplyResponse)
def update_quick_reply(
    qr_id: int,
    data: QuickReplyUpdate,
    db: Session = Depends(get_db)
):
    db_qr = commercial_service.update_quick_reply(db, qr_id, data)
    if not db_qr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Respuesta rápida no encontrada")
    return db_qr


@router.delete("/quick-replies/{qr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quick_reply(
    qr_id: int,
    db: Session = Depends(get_db)
):
    success = commercial_service.delete_quick_reply(db, qr_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Respuesta rápida no encontrada")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- STAGE RULE ENDPOINTS ---

@router.get("/stage-rules/", response_model=List[StageRuleResponse])
def read_stage_rules(
    pipeline_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    return commercial_service.get_stage_rules(db, pipeline_id=pipeline_id, is_active=is_active)


@router.post("/stage-rules/", response_model=StageRuleResponse, status_code=status.HTTP_201_CREATED)
def create_stage_rule(
    data: StageRuleCreate,
    db: Session = Depends(get_db)
):
    try:
        return commercial_service.create_stage_rule(db, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/stage-rules/{rule_id}", response_model=StageRuleResponse)
def read_stage_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    db_rule = commercial_service.get_stage_rule(db, rule_id)
    if not db_rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regla no encontrada")
    return db_rule


@router.patch("/stage-rules/{rule_id}", response_model=StageRuleResponse)
def update_stage_rule(
    rule_id: int,
    data: StageRuleUpdate,
    db: Session = Depends(get_db)
):
    try:
        db_rule = commercial_service.update_stage_rule(db, rule_id, data)
        if not db_rule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regla no encontrada")
        return db_rule
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/stage-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stage_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    success = commercial_service.delete_stage_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regla no encontrada")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/stage-rules/by-stage/", response_model=List[StageRuleResponse])
def read_rules_for_stage(
    pipeline_id: int,
    stage_id: int,
    db: Session = Depends(get_db)
):
    return commercial_service.get_rules_for_stage(db, pipeline_id=pipeline_id, stage_id=stage_id)
