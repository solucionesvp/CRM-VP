from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class AgentInDepartment(BaseModel):
    id: UUID
    name: str
    email: str
    priority: int   # 0=primario, 1=respaldo — extensible

    model_config = ConfigDict(from_attributes=True)


class DepartmentBase(BaseModel):
    name: str
    slug: str
    color: Optional[str] = None
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentResponse(DepartmentBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    agents: List[AgentInDepartment] = []

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_dept(cls, dept) -> "DepartmentResponse":
        """Serializa un ORM Department incluyendo sus agentes aplanados."""
        return cls.model_validate({
            "id":          dept.id,
            "name":        dept.name,
            "slug":        dept.slug,
            "color":       dept.color,
            "description": dept.description,
            "is_active":   dept.is_active,
            "created_at":  dept.created_at,
            "updated_at":  dept.updated_at,
            "agents": [
                {
                    "id":       lnk.user.id,
                    "name":     lnk.user.name,
                    "email":    lnk.user.email,
                    "priority": lnk.priority,
                }
                for lnk in dept.agent_links
            ],
        })
