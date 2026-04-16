from functools import lru_cache
from typing import List

from pydantic import BaseSettings, Field, validator


class Settings(BaseSettings):
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    backend_env: str = Field(default="development", env="BACKEND_ENV")
    backend_host: str = Field(default="0.0.0.0", env="BACKEND_HOST")
    backend_port: int = Field(default=8000, env="BACKEND_PORT")
    backend_cors_origins: List[str] = Field(default_factory=lambda: ["http://localhost:9002"], env="BACKEND_CORS_ORIGINS")

    postgres_url: str = Field(default="postgresql+psycopg://openmind:openmind@localhost:5432/openmind", env="POSTGRES_URL")

    neo4j_uri: str = Field(default="bolt://localhost:7687", env="NEO4J_URI")
    neo4j_username: str = Field(default="neo4j", env="NEO4J_USERNAME")
    neo4j_password: str = Field(default="password", env="NEO4J_PASSWORD")

    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", env="EMBEDDING_MODEL")
    enable_ml_stubs: bool = Field(default=True, env="ENABLE_ML_STUBS")
    preload_embedding_model: bool = Field(default=False, env="PRELOAD_EMBEDDING_MODEL")
    goal_prediction_model_path: str = Field(
        default="./app/data/goal_prediction_model.json",
        env="GOAL_PREDICTION_MODEL_PATH",
    )
    goal_prediction_model_version: str = Field(default="goal_predictor_v2", env="GOAL_PREDICTION_MODEL_VERSION")

    memory_store_backend: str = Field(default="sqlite", env="MEMORY_STORE_BACKEND")
    memory_sqlite_path: str = Field(default="./.cache/openmind_memory.sqlite3", env="MEMORY_SQLITE_PATH")

    @validator("backend_cors_origins", pre=True)
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

    @validator("memory_store_backend")
    def validate_memory_store_backend(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"sqlite", "memory"}:
            raise ValueError("MEMORY_STORE_BACKEND must be either 'sqlite' or 'memory'")
        return normalized


@lru_cache
def get_settings() -> Settings:
    return Settings()
