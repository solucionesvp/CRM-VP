from uuid import UUID
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate
from app.models.tag import Tag, ContactTag


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def get_contact(db: Session, contact_id: UUID) -> Optional[Contact]:
    return (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.deleted_at.is_(None))
        .first()
    )


def list_contacts(
    db: Session,
    page: int,
    size: int,
    q: Optional[str] = None,
    assigned_to: Optional[UUID] = None,
    tag: Optional[str] = None,
) -> tuple[list[Contact], int]:
    query = (
        db.query(Contact)
        .options(
            selectinload(Contact.opportunities),
            selectinload(Contact.tasks),
            selectinload(Contact.tags_rel),
        )
        .filter(Contact.deleted_at.is_(None))
    )


    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                Contact.name.ilike(pattern),
                Contact.company_name.ilike(pattern),
            )
        )
    if assigned_to:
        query = query.filter(Contact.assigned_to == assigned_to)
    if tag:
        query = (
            query.join(ContactTag, ContactTag.contact_id == Contact.id)
            .join(Tag, Tag.id == ContactTag.tag_id)
            .filter(Tag.name == tag, Tag.is_active == True)
        )

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    return items, total


def create_contact(db: Session, data: ContactCreate) -> Contact:
    contact = Contact(**data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


def update_contact(
    db: Session, contact_id: UUID, data: ContactUpdate
) -> Optional[Contact]:
    contact = get_contact(db, contact_id)
    if not contact:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    contact.updated_at = _utcnow()
    db.commit()
    db.refresh(contact)
    return contact


def delete_contact(db: Session, contact_id: UUID) -> bool:
    contact = get_contact(db, contact_id)
    if not contact:
        return False
    contact.deleted_at = _utcnow()
    db.commit()
    return True
