import uuid
from datetime import datetime
import sqlalchemy as sa
from app.database.session import Base


class BusinessInfo(Base):
    """Singleton table — one row holds all business context for the bot."""
    __tablename__ = "business_info"

    id             = sa.Column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Identity
    name           = sa.Column(sa.String, nullable=False)
    legal_name     = sa.Column(sa.String, nullable=True)

    # Location
    address        = sa.Column(sa.String, nullable=True)
    city           = sa.Column(sa.String, nullable=True)
    state          = sa.Column(sa.String, nullable=True)
    country        = sa.Column(sa.String, nullable=True, default="México")
    postal_code    = sa.Column(sa.String, nullable=True)
    latitude       = sa.Column(sa.Float, nullable=True)
    longitude      = sa.Column(sa.Float, nullable=True)
    google_maps_url = sa.Column(sa.String, nullable=True)

    # Contact channels
    phone            = sa.Column(sa.String, nullable=True)
    whatsapp_number  = sa.Column(sa.String, nullable=True)
    email            = sa.Column(sa.String, nullable=True)
    website          = sa.Column(sa.String, nullable=True)

    # Operations (JSON)
    # {"monday": {"open": "09:00", "close": "18:00"}, ...}
    business_hours   = sa.Column(sa.JSON, nullable=True)
    # List of areas/departments served
    areas_served     = sa.Column(sa.JSON, nullable=True)

    # Bot copy
    description          = sa.Column(sa.Text, nullable=True)
    bot_welcome_message  = sa.Column(sa.Text, nullable=True)
    bot_away_message     = sa.Column(sa.Text, nullable=True)

    created_at = sa.Column(sa.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = sa.Column(sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
