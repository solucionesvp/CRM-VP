import uuid
from datetime import datetime
from typing import TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.enums import UserRole

if TYPE_CHECKING:
    from app.models.conversation import Conversation

class User(Base):
    __tablename__ = "users"

    id = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = sa.Column(sa.String, nullable=False)
    email = sa.Column(sa.String, unique=True, nullable=False, index=True)
    role = sa.Column(
        sa.Enum(UserRole, name="user_role", create_type=True),
        nullable=False,
        default=UserRole.sales
    )
    is_active = sa.Column(sa.Boolean, default=True, nullable=False)
    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = sa.Column(
        sa.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    assigned_conversations = relationship(
        "Conversation",
        back_populates="assigned_to",
        foreign_keys="Conversation.assigned_to_user_id"
    )
