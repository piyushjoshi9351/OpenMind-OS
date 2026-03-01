from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    backend_env: str = Field(default="development", alias="BACKEND_ENV")
    backend_host: str = Field(default="0.0.0.0", alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")
    backend_cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:9002"], alias="BACKEND_CORS_ORIGINS")

    postgres_url: str = Field(default="postgresql+psycopg://openmind:openmind@localhost:5432/openmind", alias="POSTGRES_URL")

    neo4j_uri: str = Field(default="bolt://localhost:7687", alias="NEO4J_URI")
    neo4j_username: str = Field(default="neo4j", alias="NEO4J_USERNAME")
    neo4j_password: str = Field(default="password", alias="NEO4J_PASSWORD")

    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", alias="EMBEDDING_MODEL")
    enable_ml_stubs: bool = Field(default=True, alias="ENABLE_ML_STUBS")
    preload_embedding_model: bool = Field(default=False, alias="PRELOAD_EMBEDDING_MODEL")

    memory_store_backend: str = Field(default="sqlite", alias="MEMORY_STORE_BACKEND")
    memory_sqlite_path: str = Field(default="./.cache/openmind_memory.sqlite3", alias="MEMORY_SQLITE_PATH")

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> List[str]:
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        if isinstance(value, str):
            normalized = value.strip()
            if not normalized:
                return []
            if normalized.startswith("[") and normalized.endswith("]"):
                return [item.strip().strip('"').strip("'") for item in normalized[1:-1].split(",") if item.strip()]
            return [item.strip() for item in normalized.split(",") if item.strip()]
        return ["http://localhost:9002"]

    @field_validator("memory_store_backend")
    @classmethod
    def validate_memory_store_backend(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"sqlite", "memory"}:
            raise ValueError("MEMORY_STORE_BACKEND must be either 'sqlite' or 'memory'")
        return normalized


@lru_cache
def get_settings() -> Settings:
    return Settings()
