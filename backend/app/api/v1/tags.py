from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.tag import TagCreate, TagUpdate, TagResponse, ContactTagAssign
from app.services import tag_service

router = APIRouter(prefix="/tags", tags=["tags"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_tag_or_404(db: Session, tag_id: UUID) -> None:
    tag = tag_service.get_tag(db, tag_id)
    if not tag:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tag no encontrado")
    return tag


def _get_contact_or_404(db: Session, contact_id: UUID):
    from app.models.contact import Contact
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.deleted_at == None)
        .first()
    )
    if not contact:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Contacto no encontrado")
    return contact


# ── Catálogo de tags ───────────────────────────────────────────────────────────

@router.get("/", response_model=List[TagResponse])
def list_tags(include_inactive: bool = False, db: Session = Depends(get_db)):
    return tag_service.list_tags(db, include_inactive=include_inactive)


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(data: TagCreate, db: Session = Depends(get_db)):
    try:
        return tag_service.create_tag(db, data)
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))


@router.patch("/{tag_id}", response_model=TagResponse)
def update_tag(tag_id: UUID, data: TagUpdate, db: Session = Depends(get_db)):
    try:
        tag = tag_service.update_tag(db, tag_id, data)
    except ValueError as e:
        raise HTTPException(status.HTTP_409_CONFLICT, detail=str(e))
    if tag is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tag no encontrado")
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_tag(tag_id: UUID, db: Session = Depends(get_db)):
    if not tag_service.deactivate_tag(db, tag_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Tag no encontrado")


# ── Asignación a contactos ─────────────────────────────────────────────────────

@router.get("/contact/{contact_id}", response_model=List[TagResponse])
def get_contact_tags(contact_id: UUID, db: Session = Depends(get_db)):
    _get_contact_or_404(db, contact_id)
    return tag_service.get_contact_tags(db, contact_id)


@router.post("/contact/{contact_id}", response_model=List[TagResponse])
def assign_tags(contact_id: UUID, body: ContactTagAssign, db: Session = Depends(get_db)):
    _get_contact_or_404(db, contact_id)
    return tag_service.assign_tags(db, contact_id, body.tag_ids, body.assigned_by)


@router.delete(
    "/contact/{contact_id}/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_tag_from_contact(contact_id: UUID, tag_id: UUID, db: Session = Depends(get_db)):
    _get_contact_or_404(db, contact_id)
    if not tag_service.remove_tag_from_contact(db, contact_id, tag_id):
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="El tag no está asignado a este contacto",
        )
