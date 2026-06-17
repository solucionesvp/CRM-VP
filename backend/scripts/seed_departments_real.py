"""
seed_departments_real.py
Carga los 7 departamentos reales de VP y sus agentes.
Idempotente: verifica por slug/email antes de insertar.
No toca ni borra los 4 departamentos placeholder existentes.
"""
import os, sys
from pathlib import Path

# Permite ejecutar desde backend/ con: python scripts/seed_departments_real.py
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(".env")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# ── Datos ──────────────────────────────────────────────────────────────────────

AGENTS = [
    {"name": "Eloy Camarena",    "email": "eloy.camarena@vp.mx",    "role": "sales"},
    {"name": "Horalia García",   "email": "horalia.garcia@vp.mx",   "role": "sales"},
    {"name": "Esteban Zepeda",   "email": "esteban.zepeda@vp.mx",   "role": "sales"},
    {"name": "Luisa Borrego",    "email": "luisa.borrego@vp.mx",    "role": "sales"},
    {"name": "Sandra Caro",      "email": "sandra.caro@vp.mx",      "role": "sales"},
    {"name": "Lizbeth Rentería", "email": "lizbeth.renteria@vp.mx", "role": "admin"},
    {"name": "Alejandro Valdés", "email": "alejandro.valdes@vp.mx", "role": "admin"},
]

DEPARTMENTS = [
    {"name": "Ventas",                   "slug": "ventas",               "color": "#FC6621", "description": "Venta de equipos y cotizaciones"},
    {"name": "Servicio y refacciones",   "slug": "servicio_refacciones", "color": "#3B82F6", "description": "Reparación, mantenimiento y piezas"},
    {"name": "Marketing / Telemarketing","slug": "marketing",            "color": "#A855F7", "description": "Campañas y contacto proactivo"},
    {"name": "Administración y pagos",   "slug": "administracion",       "color": "#10B981", "description": "Gestión de pagos y facturación"},
    {"name": "Atención al cliente",      "slug": "atencion_cliente",     "color": "#8B5CF6", "description": "Soporte general y consultas"},
    {"name": "Operaciones",              "slug": "operaciones",          "color": "#F59E0B", "description": "Logística y procesos internos"},
    {"name": "Gerencia",                 "slug": "gerencia",             "color": "#EF4444", "description": "Dirección y decisiones estratégicas"},
]

# (slug_depto, email_agente, priority)
ASSIGNMENTS = [
    ("ventas",               "eloy.camarena@vp.mx",    0),
    ("ventas",               "horalia.garcia@vp.mx",   0),
    ("servicio_refacciones", "esteban.zepeda@vp.mx",   0),
    ("servicio_refacciones", "luisa.borrego@vp.mx",    0),
    ("marketing",            "luisa.borrego@vp.mx",    0),
    ("administracion",       "sandra.caro@vp.mx",      0),
    ("atencion_cliente",     "luisa.borrego@vp.mx",    0),
    ("operaciones",          "lizbeth.renteria@vp.mx", 0),
    ("gerencia",             "lizbeth.renteria@vp.mx", 0),
    ("gerencia",             "alejandro.valdes@vp.mx", 0),
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def upsert_user(conn, agent: dict) -> str:
    row = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": agent["email"]}).fetchone()
    if row:
        print(f"  Usuario ya existe: {agent['name']}")
        return str(row[0])
    conn.execute(
        text("INSERT INTO users (id, name, email, role, is_active, created_at, updated_at) "
             "VALUES (gen_random_uuid(), :n, :e, :r, true, now(), now()) RETURNING id"),
        {"n": agent["name"], "e": agent["email"], "r": agent["role"]},
    )
    print(f"  + Usuario creado: {agent['name']}")
    return ""   # id se resuelve vía email en asignaciones


def upsert_department(conn, dept: dict) -> None:
    row = conn.execute(text("SELECT id FROM departments WHERE slug = :s"), {"s": dept["slug"]}).fetchone()
    if row:
        print(f"  Departamento ya existe: {dept['name']}")
    else:
        conn.execute(
            text("INSERT INTO departments (id, name, slug, color, description, is_active, "
                 "last_assigned_index, created_at, updated_at) "
                 "VALUES (gen_random_uuid(), :n, :s, :c, :d, true, 0, now(), now())"),
            {"n": dept["name"], "s": dept["slug"], "c": dept["color"], "d": dept["description"]},
        )
        print(f"  + Departamento creado: {dept['name']}")


def upsert_assignment(conn, slug: str, email: str, priority: int) -> None:
    dept_id = conn.execute(text("SELECT id FROM departments WHERE slug = :s"), {"s": slug}).scalar()
    user_id = conn.execute(text("SELECT id FROM users WHERE email = :e"), {"e": email}).scalar()
    if not dept_id or not user_id:
        print(f"  [WARN] No encontrado: depto={slug} o usuario={email}")
        return
    exists = conn.execute(
        text("SELECT 1 FROM department_agents WHERE department_id=:d AND user_id=:u"),
        {"d": dept_id, "u": user_id},
    ).fetchone()
    if exists:
        print(f"  Asignación ya existe: {email} → {slug}")
    else:
        conn.execute(
            text("INSERT INTO department_agents (department_id, user_id, priority) VALUES (:d, :u, :p)"),
            {"d": dept_id, "u": user_id, "p": priority},
        )
        print(f"  + Asignado: {email} → {slug} (priority={priority})")


# ── Main ───────────────────────────────────────────────────────────────────────

with engine.connect() as conn:
    trans = conn.begin()
    try:
        print("\n── Usuarios ──────────────────────────────────")
        for a in AGENTS:
            upsert_user(conn, a)

        print("\n── Departamentos ─────────────────────────────")
        for d in DEPARTMENTS:
            upsert_department(conn, d)

        print("\n── Asignaciones ──────────────────────────────")
        for slug, email, prio in ASSIGNMENTS:
            upsert_assignment(conn, slug, email, prio)

        trans.commit()
        print("\n✓ Seed completado sin errores.\n")
    except Exception as exc:
        trans.rollback()
        print(f"\n✗ Error: {exc}")
        raise
