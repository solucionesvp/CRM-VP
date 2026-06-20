"""
Validación TANDA TAGS-A: 6 pasos de prueba del sistema de etiquetas.
Requiere BD local con tablas aplicadas (alembic upgrade heads).
"""
import sys
sys.path.insert(0, ".")

from app.database.session import SessionLocal
from app.models.contact import Contact
from app.schemas.tag import TagCreate
from app.services import tag_service

db = SessionLocal()

try:
    # Buscar un contacto existente para las pruebas
    contact = db.query(Contact).filter(Contact.deleted_at == None).first()
    if not contact:
        print("ERROR: No hay contactos en la BD. Crea uno primero.")
        sys.exit(1)
    print(f"Usando contacto: {contact.name} ({contact.id})\n")
    print("=" * 60)

    # ── Paso 1: Crear tag "ferretero" ─────────────────────────────
    t1 = tag_service.create_tag(db, TagCreate(
        name="ferretero",
        label="Ferretero",
        color="#1E40AF",
    ))
    print(f"[1] Tag creado: name={t1.name!r}, label={t1.label!r}, color={t1.color!r}, id={t1.id}")

    # ── Paso 2: Crear tag "cliente_vip" ───────────────────────────
    t2 = tag_service.create_tag(db, TagCreate(
        name="cliente_vip",
        label="Cliente VIP",
        color="#FC6621",
    ))
    print(f"[2] Tag creado: name={t2.name!r}, label={t2.label!r}, color={t2.color!r}, id={t2.id}")

    # ── Paso 3: Intentar color duplicado (#FC6621) — debe fallar ──
    try:
        tag_service.create_tag(db, TagCreate(
            name="otro_tag",
            label="Otro Tag",
            color="#FC6621",
        ))
        print("[3] ERROR: Debió lanzar ValueError por color duplicado — NO se lanzó ❌")
    except ValueError as e:
        print(f"[3] ValueError correctamente lanzado: {e!r} ✅")

    # ── Paso 4: Asignar los 2 tags al contacto ────────────────────
    asignados = tag_service.assign_tags(db, contact.id, [t1.id, t2.id], assigned_by="agent")
    print(f"[4] Tags asignados al contacto ({len(asignados)}): {[t.name for t in asignados]}")

    # ── Paso 5: Consultar tags del contacto — debe haber 2 ────────
    tags_del_contacto = tag_service.get_contact_tags(db, contact.id)
    print(f"[5] Tags consultados del contacto ({len(tags_del_contacto)}): {[t.name for t in tags_del_contacto]}")
    assert len(tags_del_contacto) == 2, "Deberían ser 2 tags"

    # ── Paso 6: Quitar t1 ("ferretero") — debe quedar solo t2 ─────
    removed = tag_service.remove_tag_from_contact(db, contact.id, t1.id)
    tags_restantes = tag_service.get_contact_tags(db, contact.id)
    print(f"[6] Tag eliminado={removed}, tags restantes ({len(tags_restantes)}): {[t.name for t in tags_restantes]}")
    assert len(tags_restantes) == 1 and tags_restantes[0].name == "cliente_vip"

    print("\n" + "=" * 60)
    print("✅ Todos los pasos completados correctamente.")

finally:
    # Limpiar datos de prueba
    try:
        tag_service.assign_tags(db, contact.id, [], assigned_by="test_cleanup")
        for name in ("ferretero", "cliente_vip", "otro_tag"):
            from app.models.tag import Tag
            db.query(Tag).filter(Tag.name == name).delete()
        db.commit()
    except Exception:
        db.rollback()
    db.close()
