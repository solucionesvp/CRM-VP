from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.enums import OpportunityStatus
from app.schemas.opportunity import (
    OpportunityCreate,
    OpportunityUpdate,
    OpportunityStageChange,
    NoteCreate,
    OpportunityResponse,
    OpportunityListResponse,
    NoteResponse,
)
from app.services import opportunity_service
from pydantic import BaseModel, ConfigDict, computed_field
from datetime import datetime
from sqlalchemy.orm import aliased
from app.models.opportunity_activity import OpportunityActivity
from app.models.opportunity_stage import OpportunityStage

class ActivityResponse(BaseModel):
    id: UUID
    opportunity_id: UUID
    action_type: str
    description: Optional[str] = None
    from_stage_name: Optional[str] = None
    to_stage_name: Optional[str] = None
    is_system: bool
    created_at: datetime

    @computed_field
    def display_text(self) -> str:
        at = self.action_type
        if hasattr(at, "value"):
            at = at.value

        if at == "created":
            return "Oportunidad creada"
        elif at == "stage_change":
            return f"Etapa cambiada: {self.from_stage_name or '?'} → {self.to_stage_name or '?'}"
        elif at == "note_added":
            return "Nota agregada"
        elif at == "closed_won":
            return "Oportunidad ganada"
        elif at == "closed_lost":
            return "Oportunidad perdida"
        elif at == "follow_up":
            return self.description if self.description else "Seguimiento registrado"
        else:
            return self.description if self.description else str(self.action_type)

    model_config = ConfigDict(from_attributes=True)

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.post("/", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
def create_opportunity(data: OpportunityCreate, db: Session = Depends(get_db)):
    try:
        return opportunity_service.create_opportunity(db, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/", response_model=OpportunityListResponse, status_code=status.HTTP_200_OK)
def list_opportunities(
    stage_id: Optional[int] = None,
    status: Optional[OpportunityStatus] = None,
    contact_id: Optional[UUID] = None,
    assigned_to: Optional[UUID] = None,
    pipeline_id: Optional[int] = None,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    items, total = opportunity_service.list_opportunities(
        db,
        page=page,
        size=size,
        stage_id=stage_id,
        status=status,
        contact_id=contact_id,
        assigned_to=assigned_to,
        pipeline_id=pipeline_id,
    )
    return OpportunityListResponse(items=items, total=total, page=page, size=size)


@router.get("/{opportunity_id}", response_model=OpportunityResponse, status_code=status.HTTP_200_OK)
def get_opportunity(opportunity_id: UUID, db: Session = Depends(get_db)):
    opp = opportunity_service.get_opportunity(db, opportunity_id)
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oportunidad no encontrada",
        )
    return opp


@router.patch("/{opportunity_id}", response_model=OpportunityResponse, status_code=status.HTTP_200_OK)
def update_opportunity(opportunity_id: UUID, data: OpportunityUpdate, db: Session = Depends(get_db)):
    try:
        opp = opportunity_service.update_opportunity(db, opportunity_id, data)
        if not opp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Oportunidad no encontrada",
            )
        return opp
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/{opportunity_id}/stage", response_model=OpportunityResponse, status_code=status.HTTP_200_OK)
def change_stage(opportunity_id: UUID, data: OpportunityStageChange, db: Session = Depends(get_db)):
    try:
        opp = opportunity_service.change_stage(
            db,
            opp_id=opportunity_id,
            new_stage_id=data.stage_id,
            user_id=None,
            description=data.description,
        )
        if not opp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Oportunidad o etapa no encontrada",
            )
        return opp
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{opportunity_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def add_note(opportunity_id: UUID, data: NoteCreate, db: Session = Depends(get_db)):
    note = opportunity_service.add_note(
        db, opp_id=opportunity_id, user_id=None, content=data.content
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oportunidad no encontrada",
        )
    return note


@router.get("/{opportunity_id}/activities", response_model=List[ActivityResponse], status_code=status.HTTP_200_OK)
def list_activities(
    opportunity_id: UUID,
    page: int = 1,
    size: int = 20,
    db: Session = Depends(get_db),
):
    opp = opportunity_service.get_opportunity(db, opportunity_id)
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oportunidad no encontrada",
        )
    
    FromStage = aliased(OpportunityStage)
    ToStage = aliased(OpportunityStage)

    query = (
        db.query(
            OpportunityActivity.id,
            OpportunityActivity.opportunity_id,
            OpportunityActivity.action_type,
            OpportunityActivity.description,
            OpportunityActivity.is_system,
            OpportunityActivity.created_at,
            FromStage.name.label("from_stage_name"),
            ToStage.name.label("to_stage_name")
        )
        .outerjoin(FromStage, OpportunityActivity.from_stage_id == FromStage.id)
        .outerjoin(ToStage, OpportunityActivity.to_stage_id == ToStage.id)
        .filter(OpportunityActivity.opportunity_id == opportunity_id)
        .order_by(OpportunityActivity.created_at.desc())
    )

    activities = query.offset((page - 1) * size).limit(size).all()
    
    results = []
    for row in activities:
        results.append(
            ActivityResponse(
                id=row.id,
                opportunity_id=row.opportunity_id,
                action_type=row.action_type.value if hasattr(row.action_type, "value") else row.action_type,
                description=row.description,
                from_stage_name=row.from_stage_name,
                to_stage_name=row.to_stage_name,
                is_system=row.is_system,
                created_at=row.created_at
            )
        )
    return results


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(opportunity_id: UUID, db: Session = Depends(get_db)):
    success = opportunity_service.delete_opportunity(db, opportunity_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oportunidad no encontrada",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
