from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.enums import ProductServiceType, ProductServiceArea

class ProductServiceBase(BaseModel):
    name: str = Field(..., description="Nombre del producto o servicio")
    type: ProductServiceType = Field(..., description="Tipo (producto o servicio)")
    sku: Optional[str] = Field(None, description="SKU")
    internal_code: Optional[str] = Field(None, description="Código interno VP")
    brand: Optional[str] = Field(None, description="Marca")
    category: Optional[str] = Field(None, description="Categoría")
    unit: Optional[str] = Field(None, description="Unidad de medida")
    description: Optional[str] = Field(None, description="Descripción detallada")
    area: ProductServiceArea = Field(..., description="Área de aplicación")
    is_active: bool = Field(True, description="Indica si está activo o descontinuado")

class ProductServiceCreate(ProductServiceBase):
    pass

class ProductServiceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ProductServiceType] = None
    sku: Optional[str] = None
    internal_code: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    description: Optional[str] = None
    area: Optional[ProductServiceArea] = None
    is_active: Optional[bool] = None

class ProductServiceResponse(ProductServiceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
