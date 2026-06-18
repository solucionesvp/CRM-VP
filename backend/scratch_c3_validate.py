"""
Validacion TANDA C3: 6 casos de clasificacion con campo calificacion.
Requiere OPENAI_API_KEY real (Railway run o env var exportada).
"""
import asyncio
import sys
import os
sys.path.insert(0, ".")

# Asegurar que el env tenga la key si se corre con railway run
from app.core.config import settings

BIZ_CTX = """Empresa: Soluciones VP
Descripcion: Centro de Servicio Autorizado Evans — venta, reparacion y mantenimiento de equipos.
Direccion: Blvd. Tepic-Xalisco #435, Col. Los Fresnos Oriente, Tepic, Nayarit, CP 63190
Horario: Lunes a Viernes: 08:30-18:00, Sabado: 08:30-14:00, Domingo: cerrado
Telefono: 311 258 0010
WhatsApp: 311 122 7119
Areas de servicio: Bombas de Agua, Compresores, Generadores, Equipos para Construccion, Equipos Hidroneumaticos, Linea de Seguridad, Refacciones Originales, Taller de Servicio, Atencion a Garantias
Formas de pago: Transferencia, tarjeta de credito/debito, efectivo en sucursal, link de pago BBVA. Sin meses sin intereses.
Tiempos de entrega: Inmediato si hay stock en tienda. Sin stock: 1-3 dias habiles.
Politica de cambios/devoluciones: No se manejan cambios ni devoluciones; VP da asesoria especializada antes de la venta.
Requisitos para cotizar: Nombre, equipo que necesita, especificaciones."""

CASOS = [
    {
        "label": "a",
        "msg": "solo quiero ver que manejan",
        "customer_history": "Cliente nuevo, sin historial previo en el CRM.",
        "esperado": "curioso",
    },
    {
        "label": "b",
        "msg": "cuanto cuesta una bomba para mi casa, la quiero ya",
        "customer_history": "Cliente nuevo, sin historial previo en el CRM.",
        "esperado": "urgente (prioridad sobre caliente)",
    },
    {
        "label": "c",
        "msg": "buenas, me urge una cotizacion para hoy",
        "customer_history": "Cliente nuevo, sin historial previo en el CRM.",
        "esperado": "urgente",
    },
    {
        "label": "d",
        "msg": "esto que me vendieron salio defectuoso, ya me canse",
        "customer_history": "Cliente nuevo, sin historial previo en el CRM.",
        "esperado": "problema",
    },
    {
        "label": "e",
        "msg": "hola, otra vez yo",
        "customer_history": "Cliente existente. Historial reciente: Bomba centrifuga 1.5HP (Ventas — Cerrada ganada, 2025-03-10). Compresores de 20L (Ventas — En seguimiento, 2024-11-05).",
        "esperado": "cliente_existente",
    },
    {
        "label": "f",
        "msg": "venden llantas para mi carro?",
        "customer_history": "Cliente nuevo, sin historial previo en el CRM.",
        "esperado": "no_apto",
    },
]


async def run():
    from app.services import ai_classifier_service

    print(f"Usando OpenAI key: {'...presente' if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith('sk-tu') else '!!! FALTA O ES PLACEHOLDER'}")
    print(f"Modelo: {settings.OPENAI_MODEL}\n")
    print("=" * 70)

    for c in CASOS:
        result = await ai_classifier_service.classify(
            message_text=c["msg"],
            recent_history=[],
            business_context=BIZ_CTX,
            collected_data={},
            customer_history=c["customer_history"],
        )
        print(f"[{c['label']}] Mensaje: \"{c['msg']}\"")
        print(f"     intent        = {result.intent}")
        print(f"     calificacion  = {result.calificacion}   (esperado: {c['esperado']})")
        print(f"     suggested     = {result.suggested_response}")
        ok = "✅" if result.calificacion == c["esperado"].split(" ")[0] else "⚠️ REVISAR"
        print(f"     resultado     = {ok}")
        print()

asyncio.run(run())
