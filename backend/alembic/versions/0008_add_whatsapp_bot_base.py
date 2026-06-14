"""add_whatsapp_bot_base

Revision ID: 0008_whatsapp_bot_base
Revises: 0007_comm_engine
Create Date: 2026-06-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0008_whatsapp_bot_base"
down_revision: Union[str, None] = "0007_comm_engine"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ── Enum helpers ───────────────────────────────────────────────────────────────

def _create_enum(name: str, *values: str) -> None:
    op.execute(f"DROP TYPE IF EXISTS {name} CASCADE")
    postgresql.ENUM(*values, name=name).create(op.get_bind())


def _drop_enum(name: str) -> None:
    op.execute(f"DROP TYPE IF EXISTS {name} CASCADE")


# ── Upgrade ───────────────────────────────────────────────────────────────────

def upgrade() -> None:
    # 1. Enum types
    _create_enum("conversationchannel", "whatsapp")
    _create_enum("conversationstatus",  "open", "assigned", "pending", "closed")
    _create_enum("messagedirection",    "inbound", "outbound")
    _create_enum("messagesendertype",   "client", "bot", "human")
    _create_enum("messagetype",         "text", "image", "audio", "video", "document", "location", "contact", "sticker", "system")
    _create_enum("messagestatus",       "pending", "sent", "delivered", "read", "failed")

    # 2. business_info
    op.create_table(
        "business_info",
        sa.Column("id",                  sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("name",                sa.String,  nullable=False),
        sa.Column("legal_name",          sa.String,  nullable=True),
        sa.Column("address",             sa.String,  nullable=True),
        sa.Column("city",                sa.String,  nullable=True),
        sa.Column("state",               sa.String,  nullable=True),
        sa.Column("country",             sa.String,  nullable=True, server_default="México"),
        sa.Column("postal_code",         sa.String,  nullable=True),
        sa.Column("latitude",            sa.Float,   nullable=True),
        sa.Column("longitude",           sa.Float,   nullable=True),
        sa.Column("google_maps_url",     sa.String,  nullable=True),
        sa.Column("phone",               sa.String,  nullable=True),
        sa.Column("whatsapp_number",     sa.String,  nullable=True),
        sa.Column("email",               sa.String,  nullable=True),
        sa.Column("website",             sa.String,  nullable=True),
        sa.Column("business_hours",      sa.JSON,    nullable=True),
        sa.Column("areas_served",        sa.JSON,    nullable=True),
        sa.Column("description",         sa.Text,    nullable=True),
        sa.Column("bot_welcome_message", sa.Text,    nullable=True),
        sa.Column("bot_away_message",    sa.Text,    nullable=True),
        sa.Column("created_at",          sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",          sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    # 3. conversations
    op.create_table(
        "conversations",
        sa.Column("id",                   sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("contact_id",           sa.UUID(as_uuid=True), nullable=False),
        sa.Column("channel",              postgresql.ENUM("whatsapp", name="conversationchannel", create_type=False), nullable=False, server_default="whatsapp"),
        sa.Column("channel_identifier",   sa.String, nullable=False),
        sa.Column("status",               postgresql.ENUM("open", "assigned", "pending", "closed", name="conversationstatus", create_type=False), nullable=False, server_default="open"),
        sa.Column("assigned_to_user_id",  sa.UUID(as_uuid=True), nullable=True),
        sa.Column("assigned_department",  sa.String, nullable=True),
        sa.Column("bot_active",           sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("last_message_at",      sa.DateTime, nullable=True),
        sa.Column("last_message_preview", sa.String, nullable=True),
        sa.Column("unread_count",         sa.Integer, nullable=False, server_default="0"),
        sa.Column("opportunity_id",       sa.UUID(as_uuid=True), nullable=True),
        sa.Column("closed_at",            sa.DateTime, nullable=True),
        sa.Column("created_at",           sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",           sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["contact_id"],          ["contacts.id"],       ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_to_user_id"], ["users.id"],          ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["opportunity_id"],      ["opportunities.id"],  ondelete="SET NULL"),
        sa.UniqueConstraint("channel", "channel_identifier", name="uq_conversation_channel_identifier"),
    )
    op.create_index("idx_conversations_contact",  "conversations", ["contact_id"])
    op.create_index("idx_conversations_status",   "conversations", ["status"])
    op.create_index("idx_conversations_assigned", "conversations", ["assigned_to_user_id"])
    op.create_index("idx_conversations_last_msg", "conversations", ["last_message_at"])

    # 4. messages
    op.create_table(
        "messages",
        sa.Column("id",              sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("external_id",     sa.String, nullable=True),
        sa.Column("direction",       postgresql.ENUM("inbound", "outbound", name="messagedirection", create_type=False), nullable=False),
        sa.Column("sender_type",     postgresql.ENUM("client", "bot", "human", name="messagesendertype", create_type=False), nullable=False),
        sa.Column("sender_user_id",  sa.UUID(as_uuid=True), nullable=True),
        sa.Column("message_type",    postgresql.ENUM("text", "image", "audio", "video", "document", "location", "contact", "sticker", "system", name="messagetype", create_type=False), nullable=False, server_default="text"),
        sa.Column("content",         sa.Text,    nullable=True),
        # Media
        sa.Column("media_url",              sa.String,  nullable=True),
        sa.Column("media_mime_type",        sa.String,  nullable=True),
        sa.Column("media_filename",         sa.String,  nullable=True),
        sa.Column("media_size_bytes",       sa.Integer, nullable=True),
        sa.Column("media_duration_seconds", sa.Integer, nullable=True),
        sa.Column("media_caption",          sa.Text,    nullable=True),
        sa.Column("media_thumbnail_url",    sa.String,  nullable=True),
        # Location
        sa.Column("location_latitude",  sa.Float,  nullable=True),
        sa.Column("location_longitude", sa.Float,  nullable=True),
        sa.Column("location_name",      sa.String, nullable=True),
        sa.Column("location_address",   sa.String, nullable=True),
        # Contact card
        sa.Column("contact_data", sa.JSON, nullable=True),
        # State
        sa.Column("status",         postgresql.ENUM("pending", "sent", "delivered", "read", "failed", name="messagestatus", create_type=False), nullable=False, server_default="pending"),
        sa.Column("error_message",  sa.Text, nullable=True),
        sa.Column("raw_payload",    sa.JSON, nullable=True),
        # Thread
        sa.Column("replied_to_message_id", sa.UUID(as_uuid=True), nullable=True),
        # Timestamps
        sa.Column("sent_at",      sa.DateTime, nullable=True),
        sa.Column("delivered_at", sa.DateTime, nullable=True),
        sa.Column("read_at",      sa.DateTime, nullable=True),
        sa.Column("created_at",   sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",   sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["conversation_id"],        ["conversations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_user_id"],         ["users.id"],         ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["replied_to_message_id"],  ["messages.id"],      ondelete="SET NULL"),
    )
    op.create_index("idx_messages_conversation", "messages", ["conversation_id"])
    op.create_index("idx_messages_external",     "messages", ["external_id"])
    op.create_index("idx_messages_direction",    "messages", ["direction"])
    op.create_index("idx_messages_created",      "messages", ["created_at"])

    # 5. conversation_contexts
    op.create_table(
        "conversation_contexts",
        sa.Column("id",              sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", sa.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("current_intent",       sa.String,  nullable=True),
        sa.Column("current_flow",         sa.String,  nullable=True),
        sa.Column("current_step",         sa.String,  nullable=True),
        sa.Column("collected_data",       sa.JSON,    nullable=True),
        sa.Column("last_bot_action",      sa.String,  nullable=True),
        sa.Column("last_bot_message_at",  sa.DateTime, nullable=True),
        sa.Column("awaiting_response",    sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("awaiting_field",       sa.String,  nullable=True),
        sa.Column("handoff_to_human",     sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("handoff_reason",       sa.String,  nullable=True),
        sa.Column("bot_memory",           sa.JSON,    nullable=True),
        sa.Column("created_at",           sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at",           sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
    )


# ── Downgrade ─────────────────────────────────────────────────────────────────

def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("conversation_contexts")

    op.drop_index("idx_messages_created",      table_name="messages")
    op.drop_index("idx_messages_direction",    table_name="messages")
    op.drop_index("idx_messages_external",     table_name="messages")
    op.drop_index("idx_messages_conversation", table_name="messages")
    op.drop_table("messages")

    op.drop_index("idx_conversations_last_msg", table_name="conversations")
    op.drop_index("idx_conversations_assigned", table_name="conversations")
    op.drop_index("idx_conversations_status",   table_name="conversations")
    op.drop_index("idx_conversations_contact",  table_name="conversations")
    op.drop_table("conversations")

    op.drop_table("business_info")

    # Drop enum types
    for name in ("messagestatus", "messagetype", "messagesendertype", "messagedirection", "conversationstatus", "conversationchannel"):
        _drop_enum(name)
