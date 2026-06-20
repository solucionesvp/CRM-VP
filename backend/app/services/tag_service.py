"""
Servicio de etiquetas (Tags).

Responsabilidad única: CRUD de tags y asignación a contactos.
Toda excepción de negocio lanza ValueError.
"""
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.tag import Tag, ContactTag
from app.models.contact import Contact
from app.schemas.tag import TagCreate, TagUpdate


# ── Catálogo de tags ───────────────────────────────────────────────────────────

def list_tags(db: Session, include_inactive: bool = False) -> List[Tag]:
    q = db.query(Tag)
    if not include_inactive:
        q = q.filter(Tag.is_active == True)
    return q.order_by(Tag.label).all()


def get_tag(db: Session, tag_id: UUID) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.id == tag_id).first()


def create_tag(db: Session, data: TagCreate) -> Tag:
    if db.query(Tag).filter(Tag.name == data.name).first():
        raise ValueError("Tag name ya existe")
    if db.query(Tag).filter(Tag.color == data.color).first():
        raise ValueError("Color ya existe — elige otro para evitar confusión")

    tag = Tag(
        name=data.name,
        label=data.label,
        color=data.color,
        description=data.description,
    )
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def update_tag(db: Session, tag_id: UUID, data: TagUpdate) -> Optional[Tag]:
    tag = get_tag(db, tag_id)
    if not tag:
        return None

    if data.color is not None and data.color != tag.color:
        conflict = db.query(Tag).filter(Tag.color == data.color, Tag.id != tag_id).first()
        if conflict:
            raise ValueError("Color ya existe — elige otro para evitar confusión")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tag, field, value)

    db.commit()
    db.refresh(tag)
    return tag


def deactivate_tag(db: Session, tag_id: UUID) -> bool:
    tag = get_tag(db, tag_id)
    if not tag:
        return False
    tag.is_active = False
    db.commit()
    return True


# ── Asignación a contactos ─────────────────────────────────────────────────────

def _get_active_contact(db: Session, contact_id: UUID) -> Optional[Contact]:
    return (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.deleted_at == None)
        .first()
    )


def get_contact_tags(db: Session, contact_id: UUID) -> List[Tag]:
    contact = _get_active_contact(db, contact_id)
    if not contact:
        return []
    return contact.tags_rel


def assign_tags(
    db: Session,
    contact_id: UUID,
    tag_ids: List[UUID],
    assigned_by: str = "agent",
) -> List[Tag]:
    """Reemplaza TODOS los tags del contacto con la nueva lista."""
    # Eliminar asignaciones actuales
    db.query(ContactTag).filter(ContactTag.contact_id == contact_id).delete()

    # Asignar nuevas
    for tag_id in tag_ids:
        link = ContactTag(
            contact_id=contact_id,
            tag_id=tag_id,
            assigned_by=assigned_by,
        )
        db.add(link)

    db.commit()

    contact = _get_active_contact(db, contact_id)
    db.refresh(contact)
    return contact.tags_rel if contact else []


def remove_tag_from_contact(db: Session, contact_id: UUID, tag_id: UUID) -> bool:
    link = (
        db.query(ContactTag)
        .filter(
            ContactTag.contact_id == contact_id,
            ContactTag.tag_id == tag_id,
        )
        .first()
    )
    if not link:
        return False
    db.delete(link)
    db.commit()
    return True


def get_tags_by_ids(db: Session, tag_ids: List[UUID]) -> List[Tag]:
    """Retorna tags por lista de IDs — para logging en bot."""
    if not tag_ids:
        return []
    return db.query(Tag).filter(Tag.id.in_(tag_ids)).all()

