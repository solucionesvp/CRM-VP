from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import UserRole

class UserBase(BaseModel):
    name: str
    email: str
    role: UserRole = UserRole.sales
    is_active: bool = True

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
