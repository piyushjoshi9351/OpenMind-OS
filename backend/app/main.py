from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.services.embedding_service import embedding_service


settings = get_settings()
setup_logging()

app = FastAPI(
    title="OpenMind OS Cognitive Engine",
    description="Backend for OpenMind OS personal cognitive twin platform",
    version="0.1.0",
    lifespan=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@asynccontextmanager
async def app_lifespan(_: FastAPI):
    if settings.preload_embedding_model and not settings.enable_ml_stubs:
        embedding_service.warmup_model()
    yield


app.router.lifespan_context = app_lifespan
