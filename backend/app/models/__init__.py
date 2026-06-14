from app.models.enums import *  # noqa
from app.models.user import User
from app.models.pipeline import Pipeline
from app.models.opportunity_stage import OpportunityStage
from app.models.contact import Contact
from app.models.opportunity import Opportunity
from app.models.opportunity_note import OpportunityNote
from app.models.opportunity_activity import OpportunityActivity
from app.models.task import Task
from app.models.product_service import ProductService
from app.models.quick_reply import QuickReply
from app.models.stage_rule import StageRule
# ── Fase 2: WhatsApp / Bot ─────────────────────────────────────────────────────
from app.models.business_info import BusinessInfo
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.conversation_context import ConversationContext

__all__ = [
    "User",
    "Pipeline",
    "OpportunityStage",
    "Contact",
    "Opportunity",
    "OpportunityNote",
    "OpportunityActivity",
    "Task",
    "ProductService",
    "QuickReply",
    "StageRule",
    "BusinessInfo",
    "Conversation",
    "Message",
    "ConversationContext",
]
