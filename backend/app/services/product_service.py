from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, select

from app.models.product_service import ProductService
from app.models.opportunity import Opportunity
from app.schemas.product_service import ProductServiceCreate, ProductServiceUpdate
from fastapi import HTTPException, status

class ProductServiceService:
    def get_all(self, db: Session, active_only: bool = False, search: Optional[str] = None) -> List[ProductService]:
        query = db.query(ProductService)
        
        if active_only:
            query = query.filter(ProductService.is_active == True)
            
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    ProductService.name.ilike(search_term),
                    ProductService.sku.ilike(search_term),
                    ProductService.description.ilike(search_term)
                )
            )
            
        return query.order_by(ProductService.name).all()

    def get_by_id(self, db: Session, ps_id: UUID) -> ProductService:
        ps = db.query(ProductService).filter(ProductService.id == ps_id).first()
        if not ps:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto/Servicio no encontrado"
            )
        return ps

    def create(self, db: Session, data: ProductServiceCreate) -> ProductService:
        # Check uniqueness
        existing_name = db.query(ProductService).filter(ProductService.name == data.name).first()
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un producto/servicio con este nombre"
            )
            
        if data.sku:
            existing_sku = db.query(ProductService).filter(ProductService.sku == data.sku).first()
            if existing_sku:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un producto/servicio con este SKU"
                )

        if data.internal_code:
            existing_code = db.query(ProductService).filter(ProductService.internal_code == data.internal_code).first()
            if existing_code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un producto/servicio con este código interno"
                )

        new_ps = ProductService(**data.model_dump())
        db.add(new_ps)
        db.commit()
        db.refresh(new_ps)
        return new_ps

    def update(self, db: Session, ps_id: UUID, data: ProductServiceUpdate) -> ProductService:
        ps = self.get_by_id(db, ps_id)
        
        # Check uniqueness if updating name, sku or internal_code
        if data.name and data.name != ps.name:
            existing_name = db.query(ProductService).filter(ProductService.name == data.name).first()
            if existing_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un producto/servicio con este nombre"
                )
                
        if data.sku and data.sku != ps.sku:
            existing_sku = db.query(ProductService).filter(ProductService.sku == data.sku).first()
            if existing_sku:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un producto/servicio con este SKU"
                )

        if data.internal_code and data.internal_code != ps.internal_code:
            existing_code = db.query(ProductService).filter(ProductService.internal_code == data.internal_code).first()
            if existing_code:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un producto/servicio con este código interno"
                )

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ps, field, value)

        db.commit()
        db.refresh(ps)
        return ps

    def delete(self, db: Session, ps_id: UUID) -> ProductService:
        ps = self.get_by_id(db, ps_id)
        
        # Check if there are related opportunities
        opps_count = db.query(Opportunity).filter(Opportunity.product_service_id == ps_id).count()
        
        if opps_count > 0:
            # Soft delete logic: deactivate instead of physically deleting
            ps.is_active = False
            db.commit()
            db.refresh(ps)
            return ps
            
        # Physical delete if no relations exist
        db.delete(ps)
        db.commit()
        return ps

product_service_service = ProductServiceService()
