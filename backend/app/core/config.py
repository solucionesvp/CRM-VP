from pydantic_settings import BaseSettings, SettingsConfigDict
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

    @model_validator(mode="after")
    def assemble_db_connection(self) -> "Settings":
        if not self.DATABASE_URL:
            # Build URL dynamically from components
            self.DATABASE_URL = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        # Ensure we replace postgres:// with postgresql:// if needed (e.g. Railway/Heroku legacy)
        if self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
