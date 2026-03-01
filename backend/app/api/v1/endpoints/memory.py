from fastapi import APIRouter

from app.models.schemas import MemoryIngestRequest, MemoryIngestResponse, MemoryQueryRequest, MemoryQueryResponse
from app.services.memory_service import memory_service


router = APIRouter()


@router.post("/ingest", response_model=MemoryIngestResponse)
def ingest_memory(payload: MemoryIngestRequest) -> MemoryIngestResponse:
    return memory_service.ingest(payload)


@router.post("/retrieve", response_model=MemoryQueryResponse)
def retrieve_memory(payload: MemoryQueryRequest) -> MemoryQueryResponse:
    return memory_service.retrieve(payload)
