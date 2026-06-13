from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.quick_reply import QuickReply
from app.models.stage_rule import StageRule
from app.schemas.commercial import QuickReplyCreate, QuickReplyUpdate, StageRuleCreate, StageRuleUpdate

# --- QUICK REPLY SERVICES ---

def get_quick_replies(
    db: Session,
    category: Optional[str] = None,
    is_active: Optional[bool] = None
) -> List[QuickReply]:
    query = db.query(QuickReply)
    if category is not None:
        query = query.filter(QuickReply.category == category)
    if is_active is not None:
        query = query.filter(QuickReply.is_active == is_active)
    
    return query.order_by(QuickReply.category.asc(), QuickReply.name.asc()).all()


def get_quick_reply(db: Session, qr_id: int) -> Optional[QuickReply]:
    return db.query(QuickReply).filter(QuickReply.id == qr_id).first()


def create_quick_reply(db: Session, data: QuickReplyCreate) -> QuickReply:
    db_qr = QuickReply(**data.model_dump())
    db.add(db_qr)
    db.commit()
    db.refresh(db_qr)
    return db_qr


def update_quick_reply(
    db: Session,
    qr_id: int,
    data: QuickReplyUpdate
) -> Optional[QuickReply]:
    db_qr = get_quick_reply(db, qr_id)
    if not db_qr:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(db_qr, key, val)
        
    db.commit()
    db.refresh(db_qr)
    return db_qr


def delete_quick_reply(db: Session, qr_id: int) -> bool:
    db_qr = get_quick_reply(db, qr_id)
    if not db_qr:
        return False
    
    db.delete(db_qr)
    db.commit()
    return True


# --- STAGE RULE SERVICES ---

def get_stage_rules(
    db: Session,
    pipeline_id: Optional[int] = None,
    is_active: Optional[bool] = None
) -> List[StageRule]:
    query = db.query(StageRule).options(
        joinedload(StageRule.pipeline),
        joinedload(StageRule.stage),
        joinedload(StageRule.quick_reply)
    )
    if pipeline_id is not None:
        query = query.filter(StageRule.pipeline_id == pipeline_id)
    if is_active is not None:
        query = query.filter(StageRule.is_active == is_active)
        
    return query.order_by(StageRule.pipeline_id.asc(), StageRule.stage_id.asc()).all()


def get_stage_rule(db: Session, rule_id: int) -> Optional[StageRule]:
    return db.query(StageRule).options(
        joinedload(StageRule.pipeline),
        joinedload(StageRule.stage),
        joinedload(StageRule.quick_reply)
    ).filter(StageRule.id == rule_id).first()


def create_stage_rule(db: Session, data: StageRuleCreate) -> StageRule:
    db_rule = StageRule(**data.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    
    # Reload with relationships
    return get_stage_rule(db, db_rule.id)


def update_stage_rule(
    db: Session,
    rule_id: int,
    data: StageRuleUpdate
) -> Optional[StageRule]:
    db_rule = db.query(StageRule).filter(StageRule.id == rule_id).first()
    if not db_rule:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(db_rule, key, val)
        
    db.commit()
    db.refresh(db_rule)
    
    # Reload with relationships
    return get_stage_rule(db, db_rule.id)


def delete_stage_rule(db: Session, rule_id: int) -> bool:
    db_rule = db.query(StageRule).filter(StageRule.id == rule_id).first()
    if not db_rule:
        return False
    
    db.delete(db_rule)
    db.commit()
    return True


def get_rules_for_stage(
    db: Session,
    pipeline_id: int,
    stage_id: int
) -> List[StageRule]:
    return (
        db.query(StageRule)
        .options(
            joinedload(StageRule.pipeline),
            joinedload(StageRule.stage),
            joinedload(StageRule.quick_reply)
        )
        .filter(
            StageRule.pipeline_id == pipeline_id,
            StageRule.stage_id == stage_id,
            StageRule.is_active == True
        )
        .all()
    )
