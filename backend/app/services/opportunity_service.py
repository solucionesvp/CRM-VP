from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.models.opportunity import Opportunity
from app.models.opportunity_note import OpportunityNote
from app.models.opportunity_activity import OpportunityActivity
from app.models.opportunity_stage import OpportunityStage
from app.models.pipeline import Pipeline
from app.models.enums import OpportunityStatus, ActivityActionType
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _base_query(db: Session):
    """Returns a query with eager-loaded stage and pipeline, excluding soft-deleted."""
    return (
        db.query(Opportunity)
        .options(
            joinedload(Opportunity.stage),
            joinedload(Opportunity.pipeline),
        )
        .filter(Opportunity.deleted_at.is_(None))
    )


def get_opportunity(db: Session, opp_id: UUID) -> Optional[Opportunity]:
    return _base_query(db).filter(Opportunity.id == opp_id).first()


def list_opportunities(
    db: Session,
    page: int,
    size: int,
    stage_id: Optional[int] = None,
    status: Optional[OpportunityStatus] = None,
    contact_id: Optional[UUID] = None,
    assigned_to: Optional[UUID] = None,
    pipeline_id: Optional[int] = None,
) -> tuple[list[Opportunity], int]:
    query = _base_query(db)
    if stage_id is not None:
        query = query.filter(Opportunity.stage_id == stage_id)
    if status is not None:
        query = query.filter(Opportunity.status == status)
    if contact_id is not None:
        query = query.filter(Opportunity.contact_id == contact_id)
    if assigned_to is not None:
        query = query.filter(Opportunity.assigned_to == assigned_to)
    if pipeline_id is not None:
        query = query.filter(Opportunity.pipeline_id == pipeline_id)
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total


def create_opportunity(db: Session, data: OpportunityCreate) -> Opportunity:
    # Validate stage exists
    stage = db.query(OpportunityStage).filter(OpportunityStage.id == data.stage_id).first()
    if not stage:
        raise ValueError(f"stage_id {data.stage_id} no existe")

    # Validate pipeline exists
    pipeline = db.query(Pipeline).filter(Pipeline.id == data.pipeline_id).first()
    if not pipeline:
        raise ValueError(f"pipeline_id {data.pipeline_id} no existe")

    opp = Opportunity(**data.model_dump())
    db.add(opp)
    db.flush()
    activity = OpportunityActivity(
        opportunity_id=opp.id,
        user_id=data.created_by,
        action_type=ActivityActionType.created,
        is_system=True,
    )
    db.add(activity)
    db.commit()
    db.refresh(opp)
    # Reload with eager joins so response includes stage + pipeline
    return get_opportunity(db, opp.id)


def update_opportunity(
    db: Session, opp_id: UUID, data: OpportunityUpdate
) -> Optional[Opportunity]:
    opp = get_opportunity(db, opp_id)
    if not opp:
        return None
    updates = data.model_dump(exclude_unset=True)
    # stage changes must go through change_stage; pipeline_id allowed here
    updates.pop("stage_id", None)
    updates.pop("status", None)
    # Validate new pipeline_id if provided
    if "pipeline_id" in updates:
        pipeline = db.query(Pipeline).filter(Pipeline.id == updates["pipeline_id"]).first()
        if not pipeline:
            raise ValueError(f"pipeline_id {updates['pipeline_id']} no existe")
    for field, value in updates.items():
        setattr(opp, field, value)
    opp.updated_at = _utcnow()
    db.commit()
    db.refresh(opp)
    return get_opportunity(db, opp_id)


def change_stage(
    db: Session,
    opp_id: UUID,
    new_stage_id: int,
    user_id: Optional[UUID] = None,
    description: Optional[str] = None,
) -> Optional[Opportunity]:
    opp = get_opportunity(db, opp_id)
    if not opp:
        return None
    stage = db.query(OpportunityStage).filter(OpportunityStage.id == new_stage_id).first()
    if not stage:
        return None
    try:
        from_stage_id = opp.stage_id
        opp.stage_id = new_stage_id
        if stage.is_won:
            opp.status = OpportunityStatus.won
            opp.won_at = _utcnow()
        elif stage.is_lost:
            opp.status = OpportunityStatus.lost
            opp.lost_at = _utcnow()
        else:
            opp.status = OpportunityStatus.active
        activity = OpportunityActivity(
            opportunity_id=opp.id,
            user_id=user_id,
            action_type=ActivityActionType.stage_change,
            from_stage_id=from_stage_id,
            to_stage_id=new_stage_id,
            description=description,
            is_system=False,
        )
        db.add(activity)
        opp.updated_at = _utcnow()
        db.commit()
        db.refresh(opp)
        return get_opportunity(db, opp_id)
    except Exception:
        db.rollback()
        raise


def add_note(
    db: Session, opp_id: UUID, user_id: Optional[UUID], content: str
) -> Optional[OpportunityNote]:
    opp = get_opportunity(db, opp_id)
    if not opp:
        return None
    note = OpportunityNote(opportunity_id=opp_id, user_id=user_id, content=content)
    db.add(note)
    db.flush()
    activity = OpportunityActivity(
        opportunity_id=opp_id,
        user_id=user_id,
        action_type=ActivityActionType.note_added,
        is_system=False,
    )
    db.add(activity)
    db.commit()
    db.refresh(note)
    return note


def get_activities(db: Session, opp_id: UUID) -> list[OpportunityActivity]:
    return (
        db.query(OpportunityActivity)
        .filter(OpportunityActivity.opportunity_id == opp_id)
        .order_by(OpportunityActivity.created_at.desc())
        .all()
    )


def delete_opportunity(db: Session, opp_id: UUID) -> bool:
    opp = get_opportunity(db, opp_id)
    if not opp:
        return False
    opp.deleted_at = _utcnow()
    db.commit()
    return True
