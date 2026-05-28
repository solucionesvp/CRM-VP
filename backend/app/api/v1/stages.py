from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.opportunity_stage import OpportunityStage
from app.models.opportunity import Opportunity
from app.models.enums import OpportunityStatus
from app.schemas.stage import StageCreate, StageUpdate, StageResponse

router = APIRouter(prefix="/stages", tags=["stages"])


@router.get("/", response_model=List[StageResponse], status_code=status.HTTP_200_OK)
def list_stages(
    pipeline_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(OpportunityStage).filter(OpportunityStage.is_active.is_(True))
    if pipeline_id is not None:
        query = query.filter(OpportunityStage.pipeline_id == pipeline_id)
    return query.order_by(OpportunityStage.order).all()


@router.post("/", response_model=StageResponse, status_code=status.HTTP_201_CREATED)
def create_stage(data: StageCreate, db: Session = Depends(get_db)):
    stage = OpportunityStage(**data.model_dump())
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage


@router.patch("/{stage_id}", response_model=StageResponse, status_code=status.HTTP_200_OK)
def update_stage(stage_id: int, data: StageUpdate, db: Session = Depends(get_db)):
    stage = db.query(OpportunityStage).filter(OpportunityStage.id == stage_id).first()
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Etapa no encontrada",
        )

    updates = data.model_dump(exclude_unset=True)

    # Enforce at-most-one is_won and is_lost rule per pipeline
    if updates.get("is_won") is True:
        conflict = (
            db.query(OpportunityStage)
            .filter(
                OpportunityStage.pipeline_id == stage.pipeline_id,
                OpportunityStage.is_won.is_(True),
                OpportunityStage.id != stage_id,
                OpportunityStage.is_active.is_(True),
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Ya existe una etapa ganadora ('{conflict.name}') en este pipeline. "
                    "Solo puede haber una etapa con is_won=True por pipeline."
                ),
            )

    if updates.get("is_lost") is True:
        conflict = (
            db.query(OpportunityStage)
            .filter(
                OpportunityStage.pipeline_id == stage.pipeline_id,
                OpportunityStage.is_lost.is_(True),
                OpportunityStage.id != stage_id,
                OpportunityStage.is_active.is_(True),
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Ya existe una etapa de pérdida ('{conflict.name}') en este pipeline. "
                    "Solo puede haber una etapa con is_lost=True por pipeline."
                ),
            )

    for field, value in updates.items():
        setattr(stage, field, value)

    db.commit()
    db.refresh(stage)
    return stage


@router.delete("/{stage_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stage(stage_id: int, db: Session = Depends(get_db)):
    stage = db.query(OpportunityStage).filter(OpportunityStage.id == stage_id).first()
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Etapa no encontrada",
        )

    # Block deactivation if there are active opportunities in this stage
    active_opps = (
        db.query(Opportunity)
        .filter(
            Opportunity.stage_id == stage_id,
            Opportunity.status == OpportunityStatus.active,
            Opportunity.deleted_at.is_(None),
        )
        .count()
    )
    if active_opps > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede desactivar una etapa con oportunidades activas",
        )

    stage.is_active = False
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
