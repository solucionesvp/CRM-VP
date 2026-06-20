"""
Validación TANDA: Filtro de categorías reales y producto por turno.
"""
import asyncio
import sys
from unittest.mock import MagicMock, patch
from uuid import uuid4

# Cargar variables de entorno del archivo .env local
from dotenv import load_dotenv
load_dotenv()

# Insertar el path del backend para poder importar de app
sys.path.insert(0, ".")

from app.services.opportunity_bot_service import decide_and_link_opportunity
from app.models.conversation import Conversation
from app.models.business_info import BusinessInfo

# Configuración de categorías de prueba
AREAS_SERVED = [
    "Bombas de Agua", "Compresores", "Generadores", 
    "Equipos para Construcción", "Equipos Hidroneumáticos", 
    "Línea de Seguridad", "Refacciones Originales", 
    "Taller de Servicio", "Atención a Garantías"
]

CASOS = [
    {
        "id": "a",
        "extracted": {"producto": "generador"},
        "collected": {},
        "desc": "debe crear oportunidad (generador encaja en Generadores)"
    },
    {
        "id": "b",
        "extracted": {"producto": "bomba"},
        "collected": {"producto": "generador"},
        "desc": "debe usar 'bomba' del extracted (no 'generador' del collected) -> debe crear oportunidad"
    },
    {
        "id": "c",
        "extracted": {},
        "collected": {"producto": "bomba"},
        "desc": "fallback a collected -> debe crear oportunidad"
    },
    {
        "id": "d",
        "extracted": {"producto": "llantas para mi camion"},
        "collected": {},
        "desc": "NO debe crear oportunidad (fuera de categorías VP)"
    },
    {
        "id": "e",
        "extracted": {"producto": "motor de agua"},
        "collected": {},
        "desc": "debe crear oportunidad (sinónimo de bomba, encaja)"
    },
    {
        "id": "f",
        "extracted": {"producto": "compresor"},
        "collected": {},
        "desc": "debe crear oportunidad (Compresores es categoría real)"
    }
]

async def run_validation():
    # Mock de BusinessInfo
    mock_info = MagicMock(spec=BusinessInfo)
    mock_info.areas_served = AREAS_SERVED

    # Mock de db
    mock_db = MagicMock()
    
    # Mock del contacto
    mock_contact = MagicMock()
    mock_contact.id = uuid4()

    print("=== INICIANDO VALIDACIÓN DE 6 CASOS ===")
    
    for caso in CASOS:
        # Re-inicializar conversación y mocks de llamadas
        mock_conversation = MagicMock(spec=Conversation)
        mock_conversation.id = uuid4()
        mock_conversation.opportunity_id = None
        
        # Mocks para imports y llamadas a base de datos / servicios
        with patch("app.services.opportunity_bot_service.get_business_info", return_value=mock_info) as mock_get_biz, \
             patch("app.services.opportunity_bot_service.db_h.get_active_opportunities_for_contact", return_value=[]) as mock_get_opps, \
             patch("app.services.opportunity_bot_service.opportunity_service.create_opportunity") as mock_create_opp:
            
            # Configuramos el mock de creación para devolver un mock con un ID
            fake_opp = MagicMock()
            fake_opp.id = uuid4()
            mock_create_opp.return_value = fake_opp
            
            await decide_and_link_opportunity(
                db=mock_db,
                conversation=mock_conversation,
                contact=mock_contact,
                intent="sales", # intent de ventas para que pase el pipeline check
                collected_data=caso["collected"],
                extracted=caso["extracted"]
            )
            
            creada = mock_conversation.opportunity_id is not None
            creada_str = "CREADA ✅" if creada else "NO CREADA ❌"
            
            print(f"Caso {caso['id']}: extracted={caso['extracted']}, collected={caso['collected']}")
            print(f"  Descripción: {caso['desc']}")
            print(f"  Resultado: {creada_str}")
            print("-" * 50)

if __name__ == "__main__":
    asyncio.run(run_validation())
