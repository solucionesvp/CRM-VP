import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.sql import text

from app.database.session import SessionLocal
from app.api.v1 import contacts_router, stages_router, pipelines_router
from app.api.v1.opportunities import router as opportunities_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Intentando conectar a PostgreSQL...")
    db = SessionLocal()
    try:
        # Execute simple query to verify connection
        db.execute(text("SELECT 1"))
        logger.info("PostgreSQL conectado correctamente")
    except Exception as e:
        logger.error(f"Error al conectar a PostgreSQL: {e}")
        raise e
    finally:
        db.close()
    yield


import os

app = FastAPI(
    title="CRM VP",
    version="0.1.0",
    description="Backend API for CRM VP",
    lifespan=lifespan,
)

origins = [
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contacts_router, prefix="/api/v1", tags=["contacts"])
app.include_router(stages_router, prefix="/api/v1", tags=["stages"])
app.include_router(pipelines_router, prefix="/api/v1", tags=["pipelines"])
app.include_router(opportunities_router, prefix="/api/v1", tags=["opportunities"])

from app.api.v1 import tasks
app.include_router(tasks.router, prefix="/api/v1")

from app.api.v1 import dashboard
app.include_router(dashboard.router, prefix="/api/v1")



@app.get("/")
def root():
    return {"status": "ok", "message": "CRM VP API running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
