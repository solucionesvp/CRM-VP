from typing import Optional
from pydantic import BaseModel, ConfigDict



class StageCreate(BaseModel):
    name: str
    slug: str
    order: int
    color: str = "#6B7280"
    is_won: bool = False
    is_lost: bool = False
    pipeline_id: int


class StageUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    order: Optional[int] = None
    color: Optional[str] = None
    is_won: Optional[bool] = None
    is_lost: Optional[bool] = None
    is_active: Optional[bool] = None



class StageResponse(BaseModel):
    id: int
    name: str
    slug: str
    order: int
    color: str
    is_won: bool
    is_lost: bool
    is_active: bool
    pipeline_id: int

    model_config = ConfigDict(from_attributes=True)
