import json
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
    backend_cors_origins: str = Field(default="http://localhost:9002", alias="BACKEND_CORS_ORIGINS")

    postgres_url: str = Field(default="postgresql+psycopg://openmind:openmind@localhost:5432/openmind", alias="POSTGRES_URL")

    neo4j_uri: str = Field(default="bolt://localhost:7687", alias="NEO4J_URI")
    neo4j_username: str = Field(default="neo4j", alias="NEO4J_USERNAME")
    neo4j_password: str = Field(default="password", alias="NEO4J_PASSWORD")

    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", alias="EMBEDDING_MODEL")
    enable_ml_stubs: bool = Field(default=False, alias="ENABLE_ML_STUBS")
    preload_embedding_model: bool = Field(default=False, alias="PRELOAD_EMBEDDING_MODEL")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    goal_prediction_model_path: str = Field(
        default="./app/data/goal_prediction_model.json",
        alias="GOAL_PREDICTION_MODEL_PATH",
    )
    goal_prediction_model_version: str = Field(default="goal_predictor_v2", alias="GOAL_PREDICTION_MODEL_VERSION")

    memory_store_backend: str = Field(default="sqlite", alias="MEMORY_STORE_BACKEND")
    memory_sqlite_path: str = Field(default="./.cache/openmind_memory.sqlite3", alias="MEMORY_SQLITE_PATH")

    @property
    def backend_cors_origins_list(self) -> List[str]:
        raw_value = self.backend_cors_origins
        if not raw_value:
            return []

        normalized = raw_value.strip()
        if not normalized:
            return []

        # Supports JSON array format used in some hosts, e.g. ["https://app.example.com"]
        if normalized.startswith("[") and normalized.endswith("]"):
            try:
                parsed = json.loads(normalized)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                # Falls back to comma-separated parsing below.
                pass

        return [item.strip() for item in normalized.split(",") if item.strip()]

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
