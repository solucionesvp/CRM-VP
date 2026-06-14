from typing import Optional
from sqlalchemy.orm import Session
from app.models.business_info import BusinessInfo
from app.schemas.business_info import BusinessInfoUpdate

def get_business_info(db: Session) -> Optional[BusinessInfo]:
    """Retorna el singleton de BusinessInfo, o None si no existe."""
    return db.query(BusinessInfo).first()

def get_or_create_business_info(db: Session) -> BusinessInfo:
    """Retorna el singleton; si no existe, lo crea con valores por defecto."""
    info = db.query(BusinessInfo).first()
    if info is None:
        info = BusinessInfo(name="Mi Negocio")
        db.add(info)
        db.commit()
        db.refresh(info)
    return info

def update_business_info(
    db: Session, 
    update_data: BusinessInfoUpdate
) -> BusinessInfo:
    """
    Actualiza el singleton. Si no existe, lo crea primero.
    Solo actualiza campos enviados (exclude_unset=True).
    """
    info = get_or_create_business_info(db)
    
    data = update_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(info, field, value)
    
    db.commit()
    db.refresh(info)
    return info
