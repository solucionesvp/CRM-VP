from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.contact import (
    ContactCreate,
    ContactUpdate,
    ContactResponse,
    ContactListResponse,
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
