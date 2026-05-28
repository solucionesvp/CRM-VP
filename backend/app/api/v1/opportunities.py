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
    ActivityResponse,
)
from app.services import opportunity_service

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.post("/", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
def create_opportunity(data: OpportunityCreate, db: Session = Depends(get_db)):
    return opportunity_service.create_opportunity(db, data)


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
    opp = opportunity_service.update_opportunity(db, opportunity_id, data)
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oportunidad no encontrada",
        )
    return opp


@router.patch("/{opportunity_id}/stage", response_model=OpportunityResponse, status_code=status.HTTP_200_OK)
def change_stage(opportunity_id: UUID, data: OpportunityStageChange, db: Session = Depends(get_db)):
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
    activities = opportunity_service.get_activities(db, opportunity_id)
    start = (page - 1) * size
    end = start + size
    return activities[start:end]


@router.delete("/{opportunity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(opportunity_id: UUID, db: Session = Depends(get_db)):
    success = opportunity_service.delete_opportunity(db, opportunity_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oportunidad no encontrada",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
