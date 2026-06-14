"""
Seed inicial de BusinessInfo para VP Equipos y Soluciones.
Ejecutar: python scripts/seed_business_info.py
"""
import sys
from pathlib import Path

# Agregar el directorio padre al path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import SessionLocal
from app.models.business_info import BusinessInfo

VP_DATA = {
    "name": "VP Equipos y Soluciones",
    "legal_name": "VP Equipos y Soluciones",
    "address": "",  # llenar después
    "city": "Tepic",
    "state": "Nayarit",
    "country": "México",
    "postal_code": "",
    "latitude": None,
    "longitude": None,
    "google_maps_url": "",
    "phone": "",
    "whatsapp_number": "",
    "email": "",
    "website": "",
    "business_hours": {
        "monday":    {"open": "09:00", "close": "18:00", "closed": False},
        "tuesday":   {"open": "09:00", "close": "18:00", "closed": False},
        "wednesday": {"open": "09:00", "close": "18:00", "closed": False},
        "thursday":  {"open": "09:00", "close": "18:00", "closed": False},
        "friday":    {"open": "09:00", "close": "18:00", "closed": False},
        "saturday":  {"open": "09:00", "close": "14:00", "closed": False},
        "sunday":    {"open": None,    "close": None,    "closed": True},
    },
    "areas_served": ["sales", "service", "parts"],
    "description": (
        "Distribuidor autorizado Evans en Tepic, Nayarit. "
        "Venta de bombas, generadores, refacciones y servicio de taller técnico."
    ),
    "bot_welcome_message": (
        "¡Hola! Soy el asistente virtual de VP Equipos y Soluciones. "
        "Estoy aquí para ayudarte con:\n\n"
        "1️⃣ Venta de equipos (bombas, generadores)\n"
        "2️⃣ Taller y servicio técnico\n"
        "3️⃣ Refacciones\n\n"
        "¿En qué te puedo ayudar hoy?"
    ),
    "bot_away_message": (
        "Gracias por escribirnos a VP Equipos y Soluciones. "
        "En este momento estamos fuera de horario de atención. "
        "Te responderemos lo antes posible. "
        "Horario: Lunes a Viernes 9:00 - 18:00, Sábados 9:00 - 14:00."
    ),
}

def main():
    db = SessionLocal()
    try:
        existing = db.query(BusinessInfo).first()
        if existing:
            print(f"BusinessInfo ya existe (id={existing.id}). Actualizando...")
            for field, value in VP_DATA.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            print(f"✓ Actualizado: {existing.name}")
        else:
            info = BusinessInfo(**VP_DATA)
            db.add(info)
            db.commit()
            db.refresh(info)
            print(f"✓ Creado: {info.name} (id={info.id})")
    finally:
        db.close()

if __name__ == "__main__":
    main()
