from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import whatsapp_service

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


class ConnectRequest(BaseModel):
    phone_number: str


@router.get("/status")
async def get_whatsapp_status():
    """
    Obtiene el estado de conexión de la instancia de WhatsApp en Evolution API.
    """
    try:
        status = await whatsapp_service.get_connection_status()
        return {"status": status}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el estado de WhatsApp: {str(e)}"
        )


@router.post("/connect")
async def connect_whatsapp(payload: ConnectRequest):
    """
    Genera un código de vinculación para conectar un número de teléfono a WhatsApp.
    """
    try:
        # Sanitizar número (dejar solo dígitos)
        phone = "".join(filter(str.isdigit, payload.phone_number))
        if not phone:
            raise HTTPException(
                status_code=400,
                detail="Número de teléfono inválido"
            )
        pairing_code = await whatsapp_service.request_pairing_code(phone)
        return {"pairingCode": pairing_code}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar código de vinculación: {str(e)}"
        )
