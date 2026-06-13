from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from typing import List
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactListResponse,
    ContactActivityResponse,
)
from app.services import contact_service

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(data: ContactCreate, db: Session = Depends(get_db)):
    return contact_service.create_contact(db, data)


@router.get("/", response_model=ContactListResponse, status_code=status.HTTP_200_OK)
def list_contacts(
    page: int = 1,
    size: int = 20,
    q: str = None,
    assigned_to: UUID = None,
    db: Session = Depends(get_db),
):
    items, total = contact_service.list_contacts(db, page, size, q, assigned_to)
    return ContactListResponse(items=items, total=total, page=page, size=size)


@router.get("/{contact_id}", response_model=ContactResponse, status_code=status.HTTP_200_OK)
def get_contact(contact_id: UUID, db: Session = Depends(get_db)):
    contact = contact_service.get_contact(db, contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado",
        )
    return contact


@router.patch("/{contact_id}", response_model=ContactResponse, status_code=status.HTTP_200_OK)
def update_contact(contact_id: UUID, data: ContactUpdate, db: Session = Depends(get_db)):
    contact = contact_service.update_contact(db, contact_id, data)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado",
        )
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: UUID, db: Session = Depends(get_db)):
    success = contact_service.delete_contact(db, contact_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{contact_id}/activities", response_model=List[ContactActivityResponse], status_code=status.HTTP_200_OK)
def list_contact_activities(
    contact_id: UUID,
    db: Session = Depends(get_db),
):
    from sqlalchemy.orm import aliased
    from app.models.opportunity import Opportunity
    from app.models.opportunity_activity import OpportunityActivity
    from app.models.opportunity_stage import OpportunityStage

    # Verify contact exists
    contact = contact_service.get_contact(db, contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contacto no encontrado",
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
            ToStage.name.label("to_stage_name"),
            Opportunity.title.label("opportunity_title")
        )
        .join(Opportunity, OpportunityActivity.opportunity_id == Opportunity.id)
        .outerjoin(FromStage, OpportunityActivity.from_stage_id == FromStage.id)
        .outerjoin(ToStage, OpportunityActivity.to_stage_id == ToStage.id)
        .filter(Opportunity.contact_id == contact_id, Opportunity.deleted_at.is_(None))
        .order_by(OpportunityActivity.created_at.desc())
    )

    activities = query.all()
    results = []
    for row in activities:
        results.append(
            ContactActivityResponse(
                id=row.id,
                opportunity_id=row.opportunity_id,
                opportunity_title=row.opportunity_title,
                action_type=row.action_type.value if hasattr(row.action_type, "value") else row.action_type,
                description=row.description,
                from_stage_name=row.from_stage_name,
                to_stage_name=row.to_stage_name,
                is_system=row.is_system,
                created_at=row.created_at
            )
        )
    return results
