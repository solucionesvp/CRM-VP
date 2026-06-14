from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.business_info import (
    BusinessInfoResponse,
    BusinessInfoUpdate,
)
from app.services import business_info_service

router = APIRouter(prefix="/business-info", tags=["business-info"])

@router.get("/", response_model=BusinessInfoResponse)
def get_business_info(db: Session = Depends(get_db)):
    """
    Retorna la información del negocio (singleton).
    Si no existe, la crea con valores por defecto.
    """
    return business_info_service.get_or_create_business_info(db)

@router.patch("/", response_model=BusinessInfoResponse)
def update_business_info(
    update_data: BusinessInfoUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza la información del negocio.
    Solo se actualizan los campos enviados.
    """
    return business_info_service.update_business_info(db, update_data)
