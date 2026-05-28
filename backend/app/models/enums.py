from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    sales = "sales"
    viewer = "viewer"

class ContactType(str, Enum):
    person = "person"
    company = "company"

class ContactSource(str, Enum):
    referral = "referral"
    cold_call = "cold_call"
    social_media = "social_media"
    walk_in = "walk_in"
    web = "web"
    exhibition = "exhibition"
    other = "other"

class OpportunityPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class OpportunityStatus(str, Enum):
    active = "active"
    won = "won"
    lost = "lost"

class ActivityActionType(str, Enum):
    stage_change = "stage_change"
    note_added = "note_added"
    call_made = "call_made"
    whatsapp_sent = "whatsapp_sent"
    email_sent = "email_sent"
    follow_up = "follow_up"
    created = "created"
    closed_won = "closed_won"
    closed_lost = "closed_lost"
    other = "other"
