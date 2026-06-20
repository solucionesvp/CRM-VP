from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator


class TagBase(BaseModel):
    name: str
    label: str
    color: str
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_must_be_slug(cls, v: str) -> str:
        v = v.strip()
        if v != v.lower():
            raise ValueError("El nombre del tag debe estar en minúsculas")
        if " " in v:
            raise ValueError("El nombre del tag no puede contener espacios (usa _ como separador)")
        return v

    @field_validator("color")
    @classmethod
    def color_must_be_hex(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith("#") or len(v) != 7:
            raise ValueError("El color debe ser un hex de 7 caracteres, ej: '#FC6621'")
        return v


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    label: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("color")
    @classmethod
    def color_must_be_hex(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not v.startswith("#") or len(v) != 7:
            raise ValueError("El color debe ser un hex de 7 caracteres, ej: '#FC6621'")
        return v


class TagResponse(TagBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContactTagAssign(BaseModel):
    tag_ids: List[UUID]
    assigned_by: str = "agent"
