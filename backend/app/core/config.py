try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
except ImportError as e:
    raise ImportError(
        "El módulo 'pydantic_settings' no está instalado. Asegúrese de activar el entorno virtual (venv) "
        "con 'source venv/bin/activate' e instalar las dependencias con 'pip install -r requirements.txt'."
    ) from e

from pydantic import model_validator
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "CRM VP API"
    API_V1_STR: str = "/api/v1"

    # PostgreSQL configuration defaults
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "crm_vp"
    
    # Complete database connection URL (will be assembled if not set)
    DATABASE_URL: Optional[str] = None

    # WhatsApp Cloud API
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "crmvp2026"

    # Evolution API (actual WhatsApp gateway)
    EVOLUTION_API_URL: str = "https://evolution-api-production-acf96.up.railway.app"
    EVOLUTION_API_KEY: str = "crmvp2026evo"
    EVOLUTION_INSTANCE: str = "vp-test"

    # OpenAI — clasificador de mensajes del bot
    OPENAI_API_KEY: str = ""              # requerida para IA real; fallback a keywords si vacia
    OPENAI_MODEL: str = "gpt-4o-mini"    # cambiar a gpt-5.4-mini via .env / Railway

    # Bot — ventana de espera para mensajes fragmentados (debounce)
    BOT_DEBOUNCE_SECONDS: float = 8.0    # segundos de silencio antes de procesar

    # Cloudflare R2 — almacenamiento de media (S3-compatible)
    R2_ACCOUNT_ID:        str = ""
    R2_ACCESS_KEY_ID:     str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME:       str = "crm-vp-files"
    R2_PUBLIC_URL:        str = ""        # ej: https://pub-xxxx.r2.dev o dominio custom

    @model_validator(mode="after")
    def assemble_db_connection(self) -> "Settings":
        if not self.DATABASE_URL:
            # Build URL dynamically from components
            self.DATABASE_URL = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        # Ensure we replace postgres:// with postgresql:// if needed (e.g. Railway/Heroku legacy)
        if self.DATABASE_URL and self.DATABASE_URL.startswith("po   stgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

