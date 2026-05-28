# CRM VP — Domain Plan Técnico
> Versión 1.0 · 2026-05-28 · Estado: **pendiente de aprobación**

---

## 1. Confirmación y correcciones de entidades

### ✅ User
Sin cambios. Los campos propuestos son correctos y suficientes para la fase actual.

**Corrección menor:**
- `role` debe incluir un tercer valor: `viewer` (solo lectura). Típico en CRMs para gerentes que solo consultan. Agrega cobertura sin complejidad.

```
role: enum → admin, sales, viewer
```

---

### ✅ Contact
Sólido. Correcciones y aclaraciones:

**Corrección 1:** `phone` debería ser `nullable=True`. En prospectos iniciales puede no conocerse el teléfono (solo nombre y empresa).

**Corrección 2:** Agregar campo `assigned_to: UUID FK → users, nullable`. Un contacto puede tener un vendedor responsable independiente de cada oportunidad. Evita que la responsabilidad viva solo en Opportunity.

**Corrección 3:** Agregar campo `tags: ARRAY(str), nullable` — permite categorizar contactos con etiquetas libres (ej: "industrial", "fontanería", "recompra").

**Corrección 4:** `source` debería incluir el valor `exhibition` (ferias industriales, típico en VP).

```
source: enum → referral, cold_call, social_media, walk_in, web, exhibition, other
```

---

### ✅ OpportunityStage
Diseño limpio. Sin cambios al esquema.

**Observación:** `is_won` e `is_lost` no deberían coexistir ambos en `true` en la misma fila. Esto se valida a nivel de servicio, no de base de datos. Documentar como regla de negocio.

**Confirmación de seed data:** Las 7 etapas propuestas son correctas para el contexto de VP (equipo industrial Evans, Tepic).

---

### ✅ Opportunity
Muy bien pensado. Correcciones:

**Corrección 1:** `status` y `stage_id` pueden desincronizarse. Regla a aplicar en el servicio:
- Cuando `stage.is_won = true` → forzar `status = won`, poblar `won_at`.
- Cuando `stage.is_lost = true` → forzar `status = lost`, poblar `lost_at`.

**Corrección 2:** Agregar `currency: str, default "MXN"`. VP trabaja en pesos, pero eventualmente puede haber cotizaciones en USD para equipos importados.

**Corrección 3:** `service_interest` → renombrar a `product_interest` para reflejar el contexto de VP (productos Evans, no servicios abstractos). Más claro para el equipo de ventas.

```
product_interest: str  ← renombrado desde service_interest
currency: str, default "MXN"
```

---

### ✅ OpportunityNote
Sin cambios. Limpio y correcto.

**Observación:** No incluir `updated_at`. Una nota no debe editarse; solo crearse o borrarse. Mantiene integridad del historial de ventas.

---

### ✅ OpportunityActivity
Sin cambios en los campos propuestos.

**Corrección 1:** El campo `metadata` es nombre reservado en SQLAlchemy. Debe llamarse `extra_metadata` en el modelo Python con `Column("metadata", JSON)` para que la columna en PG se llame `metadata`.

**Corrección 2:** Agregar `is_system: bool, default false`. Distingue actividades generadas automáticamente por el sistema (cambio de etapa, cierre) vs. registradas manualmente por el vendedor. Crítico para filtrar el historial en UI.

---

## 2. Relaciones exactas

```
users ──────────────────────────────────────────────────────────┐
  │                                                              │
  │ created_by (1:N)                assigned_to (1:N)           │
  ▼                                      ▼                      │
contacts ─────────────── opportunities ──────────────────────── │
  (1:N)                     (1:N)  (N:1)                        │
                              │                                  │
                 ┌────────────┴────────────┐                    │
                 ▼                         ▼                    │
        opportunity_notes     opportunity_activities            │
             (N:1)                    (N:1)                     │
              user_id                user_id ────────────────── ┘

opportunity_stages ────── opportunities (stage_id, N:1)
opportunity_stages ────── opportunity_activities (from/to stage, N:1)
```

| Relación | Tipo | FK | Notas |
|---|---|---|---|
| Contact → Opportunities | 1:N | `contact_id` | Un contacto puede tener múltiples oportunidades a lo largo del tiempo |
| User → Contacts | 1:N | `created_by` | Quién registró el contacto |
| User → Contacts | 1:N | `assigned_to` | Quién lleva el contacto (puede cambiar) |
| User → Opportunities | 1:N | `assigned_to` | Vendedor responsable de la oportunidad |
| User → Opportunities | 1:N | `created_by` | Quién creó la oportunidad |
| OpportunityStage → Opportunities | 1:N | `stage_id` | Etapa actual |
| Opportunity → Notes | 1:N | `opportunity_id` | Historial de notas |
| Opportunity → Activities | 1:N | `opportunity_id` | Log de actividad |
| OpportunityStage → Activities | 1:N | `from_stage_id` | Etapa de origen en cambio |
| OpportunityStage → Activities | 1:N | `to_stage_id` | Etapa de destino en cambio |
| User → Notes | 1:N | `user_id` | Quién escribió la nota |
| User → Activities | 1:N | `user_id` | Quién generó la actividad (nullable = sistema) |

---

## 3. Campos recomendados para horizonte 5 años

Estos **no se implementan ahora** pero el schema los debe poder recibir sin migraciones destructivas:

### Contact
| Campo | Tipo | Propósito |
|---|---|---|
| `rfc` | str, nullable | Facturación futura (obligatorio en México para facturas) |
| `linkedin_url` | str, nullable | Prospección B2B |
| `birthday` | date, nullable | Felicitaciones automatizadas (n8n) |
| `preferred_contact_method` | enum: phone/whatsapp/email | Para n8n routing |
| `external_id` | str, nullable | ID en sistema externo (ERP, contabilidad) |
| `credit_limit` | decimal(12,2), nullable | Para clientes con cuenta corriente |

### Opportunity
| Campo | Tipo | Propósito |
|---|---|---|
| `quote_number` | str, nullable | Número de cotización cuando se integre módulo de cotizaciones |
| `competitor` | str, nullable | ¿Contra quién se compite? Inteligencia comercial |
| `discount_pct` | decimal(5,2), nullable | % de descuento aplicado |
| `contract_url` | str, nullable | Link al contrato firmado (S3/Drive) |
| `delivery_date` | date, nullable | Fecha de entrega pactada |
| `invoice_id` | UUID, nullable | FK a módulo de facturación futuro |

### OpportunityActivity
| Campo | Tipo | Propósito |
|---|---|---|
| `channel` | enum: system/whatsapp/email/call/manual | Canal de comunicación |
| `external_message_id` | str, nullable | ID de mensaje en WhatsApp/email para trazabilidad |
| `duration_seconds` | int, nullable | Duración de llamada si aplica |

---

## 4. Riesgos técnicos

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| 1 | **Desincronía stage/status** | Alta | Alto | Lógica centralizada en `opportunity_service.py`; nunca actualizar `status` directamente desde el router |
| 2 | **UUIDs en FK sin índices** | Media | Alto | Agregar `Index()` explícito en SQLAlchemy para `contact_id`, `assigned_to`, `stage_id` en `Opportunity` desde el inicio |
| 3 | **Soft delete invisible en queries** | Alta | Medio | `deleted_at IS NULL` debe ser filtro por defecto en **todos** los métodos de repositorio; documentar como regla |
| 4 | **Enums Python vs PostgreSQL** | Baja | Alto | Usar `sa.Enum(..., name="...", create_type=True)` en SQLAlchemy para que Alembic los gestione como tipos nativos de PG |
| 5 | **Seed de etapas duplicado** | Media | Medio | Usar `INSERT ... ON CONFLICT DO NOTHING` en el script de seed; idempotente |
| 6 | **`metadata` como nombre de campo** | Alta | Bajo | Nombre reservado en SQLAlchemy — usar `extra_metadata` en Python, `Column("metadata", JSON)` para PG |
| 7 | **Base declarativa compartida** | Baja | Alto | Todos los modelos importan `Base` desde `app.database.session` — no crear bases adicionales |
| 8 | **Paginación sin cursor** | Media | Medio | Implementar con `offset/limit` ahora; preparar para cursor-based cuando haya >10k registros |

---

## 5. Archivos exactos a crear

### Modelos (7 archivos)
```
backend/app/models/__init__.py
backend/app/models/user.py
backend/app/models/contact.py
backend/app/models/opportunity_stage.py
backend/app/models/opportunity.py
backend/app/models/opportunity_note.py
backend/app/models/opportunity_activity.py
```

### Schemas Pydantic (4 archivos)
```
backend/app/schemas/user.py
backend/app/schemas/contact.py
backend/app/schemas/opportunity.py
backend/app/schemas/stage.py
```

### Servicios (2 archivos)
```
backend/app/services/contact_service.py
backend/app/services/opportunity_service.py
```

### Routers (4 archivos)
```
backend/app/api/v1/__init__.py
backend/app/api/v1/contacts.py
backend/app/api/v1/opportunities.py
backend/app/api/v1/stages.py
```

### Migración + Seed (2 archivos)
```
backend/alembic/versions/0001_initial_crm_schema.py
backend/scripts/seed_stages.py
```

**Total: 19 archivos** distribuidos en las tandas siguientes.

---

## 6. Tandas de implementación (máx. 3 archivos por tanda)

---

### TANDA 1-A — Primeros 3 modelos
**Archivos:**
1. `backend/app/models/user.py`
2. `backend/app/models/contact.py`
3. `backend/app/models/opportunity_stage.py`

**Validación:** `alembic check` detecta 3 tablas nuevas.

---

### TANDA 1-B — Modelos restantes
**Archivos:**
1. `backend/app/models/opportunity.py`
2. `backend/app/models/opportunity_note.py`
3. `backend/app/models/opportunity_activity.py`

**Validación:** `alembic check` detecta 6 tablas totales.

---

### TANDA 1-C — Init + Migración + Seed
**Archivos:**
1. `backend/app/models/__init__.py`
2. `backend/alembic/versions/0001_initial_crm_schema.py`
3. `backend/scripts/seed_stages.py`

**Validación:** `alembic upgrade head` → 6 tablas creadas. `python scripts/seed_stages.py` → 7 etapas en PG.

---

### TANDA 2-A — Schemas base
**Archivos:**
1. `backend/app/schemas/contact.py`
2. `backend/app/schemas/stage.py`
3. `backend/app/schemas/user.py`

---

### TANDA 2-B — Schema oportunidad + servicios
**Archivos:**
1. `backend/app/schemas/opportunity.py`
2. `backend/app/services/contact_service.py`
3. `backend/app/services/opportunity_service.py`

**Validación:** Script Python que crea contacto + oportunidad + cambia etapa y verifica actividad registrada.

---

### TANDA 3-A — Routers contacts + stages
**Archivos:**
1. `backend/app/api/v1/__init__.py`
2. `backend/app/api/v1/contacts.py`
3. `backend/app/api/v1/stages.py`

**Validación:** curl a `/api/v1/contacts` y `/api/v1/stages`.

---

### TANDA 3-B — Router opportunities + integración final
**Archivos:**
1. `backend/app/api/v1/opportunities.py`
2. `backend/app/main.py` (modificar — registrar routers)

**Validación:** Suite completa de curl (sección 7).

---

## 7. Plan de pruebas con curl

### Stages
```bash
# Obtener etapas del pipeline
curl -s http://localhost:8000/api/v1/stages | jq .
# Esperado: array con 7 etapas ordenadas por `order`
```

### Contacts — CRUD completo
```bash
# Crear contacto
curl -s -X POST http://localhost:8000/api/v1/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "person",
    "name": "Carlos Hernández",
    "company_name": "Ferretería El Tornillo",
    "phone": "3111234567",
    "source": "referral",
    "city": "Tepic"
  }' | jq .
# Esperado: 201 con UUID asignado

# Listar (paginado)
curl -s "http://localhost:8000/api/v1/contacts?page=1&size=20" | jq .
# Esperado: { items: [...], total: N, page: 1, size: 20 }

# Buscar por nombre
curl -s "http://localhost:8000/api/v1/contacts?q=Carlos" | jq .

# Obtener por ID
curl -s http://localhost:8000/api/v1/contacts/{id} | jq .

# Actualizar
curl -s -X PATCH http://localhost:8000/api/v1/contacts/{id} \
  -H "Content-Type: application/json" \
  -d '{"phone": "3119876543"}' | jq .
# Esperado: 200 con campo actualizado

# Soft delete
curl -s -X DELETE http://localhost:8000/api/v1/contacts/{id}
# Esperado: 204. Validar que `deleted_at` está poblado en DB.
```

### Opportunities — Flujo completo
```bash
# Crear oportunidad
curl -s -X POST http://localhost:8000/api/v1/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": "{contact_uuid}",
    "title": "Compra bomba Evans 1HP",
    "product_interest": "Bomba centrífuga Evans 1HP",
    "stage_id": 1,
    "priority": "high",
    "expected_value": 4500.00
  }' | jq .
# Esperado: 201, status=active, actividad "created" registrada automáticamente

# Listar con filtros
curl -s "http://localhost:8000/api/v1/opportunities?stage_id=1&status=active" | jq .
curl -s "http://localhost:8000/api/v1/opportunities?contact_id={uuid}" | jq .

# Cambiar etapa (operación crítica)
curl -s -X PATCH http://localhost:8000/api/v1/opportunities/{id}/stage \
  -H "Content-Type: application/json" \
  -d '{"stage_id": 4, "description": "Se envió cotización por WhatsApp"}' | jq .
# Esperado: stage actualizado + actividad "stage_change" con from_stage_id y to_stage_id

# Cerrar ganado (vía stage won, id=6)
curl -s -X PATCH http://localhost:8000/api/v1/opportunities/{id}/stage \
  -H "Content-Type: application/json" \
  -d '{"stage_id": 6}' | jq .
# Esperado: status=won, won_at=timestamp actual

# Agregar nota
curl -s -X POST http://localhost:8000/api/v1/opportunities/{id}/notes \
  -H "Content-Type: application/json" \
  -d '{"content": "Cliente confirma interés, llamar el viernes"}' | jq .
# Esperado: 201 + actividad "note_added" registrada

# Ver historial de actividades
curl -s http://localhost:8000/api/v1/opportunities/{id}/activities | jq .
# Esperado: array ordenado DESC por created_at

# Soft delete
curl -s -X DELETE http://localhost:8000/api/v1/opportunities/{id}
# Esperado: 204
```

---

## 8. Notas de implementación clave

1. **`extra_metadata` en lugar de `metadata`** — SQLAlchemy reserva ese nombre. El campo JSON en `OpportunityActivity` debe definirse como `extra_metadata` en el modelo Python con `Column("metadata", JSON)` para que la columna en PG se llame `metadata`.

2. **Indexes explícitos desde la migración inicial:**
   - `contacts.phone`
   - `contacts.assigned_to`
   - `opportunities.contact_id`
   - `opportunities.stage_id`
   - `opportunities.assigned_to`
   - `opportunities.status`

3. **`Base` única** — Todos los modelos importan desde `app.database.session`. El `models/__init__.py` importa todos los modelos para que Alembic los descubra en `autogenerate`.

4. **Soft delete consistente** — Todos los métodos de listado en servicios filtran `deleted_at IS NULL` por defecto. El router de DELETE no recibe `deleted_at` del cliente.

5. **Actividad automática en cambio de etapa** — `opportunity_service.change_stage()` es el único punto que escribe en `opportunity_activities` para cambios de etapa. Los routers no crean actividades directamente.

---

*Plan listo para revisión. Esperando aprobación antes de iniciar Tanda 1-A.*
