import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, Table, select

# Load environment variables from .env
load_dotenv(".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

# Normalize URL for SQLAlchemy if needed
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Autoload table columns and structure
opportunity_stages = Table("opportunity_stages", metadata, autoload_with=engine)

stages_data = [
    {"name": "Nuevo interés", "slug": "new", "order": 1, "color": "#6B7280", "is_won": False, "is_lost": False, "is_active": True},
    {"name": "Contactado", "slug": "contacted", "order": 2, "color": "#3B82F6", "is_won": False, "is_lost": False, "is_active": True},
    {"name": "Interesado", "slug": "interested", "order": 3, "color": "#8B5CF6", "is_won": False, "is_lost": False, "is_active": True},
    {"name": "Cotización enviada", "slug": "quote_sent", "order": 4, "color": "#F59E0B", "is_won": False, "is_lost": False, "is_active": True},
    {"name": "Seguimiento", "slug": "follow_up", "order": 5, "color": "#EC4899", "is_won": False, "is_lost": False, "is_active": True},
    {"name": "Cerrado ganado", "slug": "won", "order": 6, "color": "#10B981", "is_won": True, "is_lost": False, "is_active": True},
    {"name": "Cerrado perdido", "slug": "lost", "order": 7, "color": "#EF4444", "is_won": False, "is_lost": True, "is_active": True},
]

with engine.connect() as conn:
    trans = conn.begin()
    try:
        for stage in stages_data:
            # Idempotent check
            query = select(opportunity_stages).where(opportunity_stages.c.slug == stage["slug"])
            result = conn.execute(query).fetchone()
            if result:
                print(f"Etapa '{stage['name']}' ya existe")
            else:
                stmt = opportunity_stages.insert().values(**stage)
                conn.execute(stmt)
                print(f"Etapa '{stage['name']}' insertada")
        trans.commit()
    except Exception as e:
        trans.rollback()
        print(f"Error seeding stages: {e}")
        raise e
