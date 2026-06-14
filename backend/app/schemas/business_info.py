from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BusinessHours(BaseModel):
    """Estructura para un día de horario"""
    open: Optional[str] = None    # "09:00"
    close: Optional[str] = None   # "18:00"
    closed: bool = False          # día cerrado

class BusinessInfoBase(BaseModel):
    name: str
    legal_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "México"
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_url: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    areas_served: Optional[List[str]] = None
    description: Optional[str] = None
    bot_welcome_message: Optional[str] = None
    bot_away_message: Optional[str] = None

class BusinessInfoUpdate(BaseModel):
    """Todos los campos opcionales para PATCH"""
    name: Optional[str] = None
    legal_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_url: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    areas_served: Optional[List[str]] = None
    description: Optional[str] = None
    bot_welcome_message: Optional[str] = None
    bot_away_message: Optional[str] = None

class BusinessInfoResponse(BusinessInfoBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
