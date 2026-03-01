from pathlib import Path

from app.models.schemas import MemoryIngestRequest, MemoryQueryRequest
from app.services.memory_service import MemoryService


def test_memory_service_sqlite_persistence_roundtrip(tmp_path: Path) -> None:
    sqlite_file = tmp_path / "memory.sqlite3"

    first = MemoryService(store_backend="sqlite", sqlite_path=str(sqlite_file))
    first.ingest(
        MemoryIngestRequest(
            user_id="user-a",
            content="Study transformer architecture and embedding retrieval.",
            node_type="note",
        )
    )

    second = MemoryService(store_backend="sqlite", sqlite_path=str(sqlite_file))
    result = second.retrieve(
        MemoryQueryRequest(
            user_id="user-a",
            query="embedding retrieval",
            top_k=3,
        )
    )

    assert len(result.matches) >= 1
    assert result.matches[0].node_type == "note"


def test_memory_service_runtime_status_memory_backend() -> None:
    service = MemoryService(store_backend="memory")
    status = service.runtime_status()

    assert status["backend"] == "memory"
    assert "total_items" in status
