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
    "name": "Soluciones VP",
    "legal_name": "VP Equipos y Soluciones",
    "address": "Blvd. Tepic–Xalisco #435, Col. Los Fresnos Oriente",
    "city": "Tepic",
    "state": "Nayarit",
    "country": "México",
    "postal_code": "63190",
    "latitude": None,
    "longitude": None,
    "google_maps_url": "",
    "phone": "311 258 0010",
    "whatsapp_number": "311 122 7119",
    "email": "",
    "website": "",
    "business_hours": {
        "monday":    {"open": "08:30", "close": "18:00", "closed": False},
        "tuesday":   {"open": "08:30", "close": "18:00", "closed": False},
        "wednesday": {"open": "08:30", "close": "18:00", "closed": False},
        "thursday":  {"open": "08:30", "close": "18:00", "closed": False},
        "friday":    {"open": "08:30", "close": "18:00", "closed": False},
        "saturday":  {"open": "08:30", "close": "14:00", "closed": False},
        "sunday":    {"open": None,    "close": None,    "closed": True},
    },
    "areas_served": [
        "Bombas de Agua", "Compresores", "Generadores", 
        "Equipos para Construcción", "Equipos Hidroneumáticos", 
        "Línea de Seguridad", "Refacciones Originales", 
        "Taller de Servicio", "Atención a Garantías"
    ],
    "description": (
        "Centro de Servicio Autorizado Evans — venta, reparación y mantenimiento de equipos. "
        "Cobertura: Tepic (matriz). Sucursal de Santiago Ixcuintla cerrada. "
        "Garantía: Directa de fábrica Evans, sin intermediarios, proceso local."
    ),
    "politica_cambios_devoluciones": "No se manejan cambios ni devoluciones; VP da asesoría especializada antes de la venta para reducir margen de error. Importante verificar que el equipo sea correcto y esté en buen estado al recibirlo.",
    "tiempos_entrega": "Inmediato si hay stock en tienda. Sin stock: 1–3 días hábiles. Equipos especializados (generadores, bombas industriales, compresores): desde 4 semanas según surtido del fabricante.",
    "formas_pago": "Transferencia, tarjeta de crédito/débito, efectivo en sucursal, link de pago BBVA. Sin meses sin intereses.",
    "telefono_oficina": "311 258 0010 (conmutador, deriva por extensión al área)",
    "requisitos_cotizacion": "Nombre, equipo que necesita, especificaciones.",
    "bot_welcome_message": (
        "¡Hola! Soy el asistente virtual de Soluciones VP. "
        "Estoy aquí para ayudarte con:\n\n"
        "1️⃣ Venta de equipos (bombas, generadores)\n"
        "2️⃣ Taller y servicio técnico\n"
        "3️⃣ Refacciones\n\n"
        "¿En qué te puedo ayudar hoy?"
    ),
    "bot_away_message": (
        "Gracias por escribirnos a Soluciones VP. "
        "En este momento estamos fuera de horario de atención. "
        "Te responderemos lo antes posible. "
        "Horario: Lunes a Viernes 8:30 - 18:00, Sábados 8:30 - 14:00."
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
