from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.product_service import ProductServiceCreate, ProductServiceUpdate, ProductServiceResponse
from app.services.product_service import product_service_service

router = APIRouter(prefix="/product-services", tags=["product_services"])

@router.get("", response_model=List[ProductServiceResponse])
def get_product_services(
    active_only: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return product_service_service.get_all(db, active_only=active_only, search=search)

@router.post("", response_model=ProductServiceResponse, status_code=201)
def create_product_service(
    data: ProductServiceCreate,
    db: Session = Depends(get_db)
):
    return product_service_service.create(db, data)

@router.put("/{ps_id}", response_model=ProductServiceResponse)
def update_product_service(
    ps_id: UUID,
    data: ProductServiceUpdate,
    db: Session = Depends(get_db)
):
    return product_service_service.update(db, ps_id, data)

@router.delete("/{ps_id}", response_model=ProductServiceResponse)
def delete_product_service(
    ps_id: UUID,
    db: Session = Depends(get_db)
):
    return product_service_service.delete(db, ps_id)
