"""
Modelos de etiquetas (tags) del CRM.

Tag       — catálogo de etiquetas.
ContactTag — tabla intermedia Contact ↔ Tag (many-to-many).
"""
import uuid
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base


class Tag(Base):
    __tablename__ = "tags"

    id          = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = sa.Column(sa.String, nullable=False, unique=True)
    label       = sa.Column(sa.String, nullable=False)
    color       = sa.Column(sa.String(7), nullable=False, unique=True)
    description = sa.Column(sa.Text, nullable=True)
    is_active   = sa.Column(sa.Boolean, default=True, nullable=False)
    created_at  = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at  = sa.Column(
        sa.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    contacts = relationship(
        "Contact",
        secondary="contact_tags",
        back_populates="tags_rel",
    )


class ContactTag(Base):
    __tablename__ = "contact_tags"

    contact_id  = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("contacts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag_id = sa.Column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    )
    assigned_by = sa.Column(sa.String, nullable=True)   # "bot" | "agent" | "admin"
    created_at  = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
