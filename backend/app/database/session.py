from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Create the SQLAlchemy engine. pool_pre_ping checks the connection health on each checkout.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

# Create a sessionmaker instance
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base class for SQLAlchemy models
Base = declarative_base()

# Dependency to yield database sessions per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
