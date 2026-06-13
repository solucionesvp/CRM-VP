import sqlalchemy as sa
from sqlalchemy.sql import func
from app.database.session import Base
from app.models.enums import QuickReplyCategory

class QuickReply(Base):
    __tablename__ = "quick_replies"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.String(150), nullable=False)
    category = sa.Column(
        sa.Enum(QuickReplyCategory, name="quickreplycategory"),
        nullable=False,
        default=QuickReplyCategory.general
    )
    content = sa.Column(sa.Text, nullable=False)
    tags = sa.Column(sa.String(300), nullable=True)
    is_active = sa.Column(sa.Boolean, nullable=False, default=True)
    created_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = sa.Column(
        sa.DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
