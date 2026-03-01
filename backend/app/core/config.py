from functools import lru_cache
from typing import List

from pydantic import Field
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


@lru_cache
def get_settings() -> Settings:
    return Settings()
