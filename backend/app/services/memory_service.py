import json
from pathlib import Path
import sqlite3
from threading import Lock
import uuid
from dataclasses import dataclass

from app.models.schemas import (
    MemoryIngestRequest,
    MemoryIngestResponse,
    MemoryMatch,
    MemoryQueryRequest,
    MemoryQueryResponse,
)
from app.core.config import get_settings
from app.services.embedding_service import embedding_service


@dataclass
class MemoryItem:
    node_id: str
    user_id: str
    content: str
    node_type: str
    vector: list[float]


class MemoryService:
    def __init__(self, store_backend: str | None = None, sqlite_path: str | None = None):
        settings = get_settings()
        self._store_backend = (store_backend or settings.memory_store_backend).strip().lower()
        self._sqlite_path = str(Path(sqlite_path or settings.memory_sqlite_path).resolve())
        self._index: dict[str, list[MemoryItem]] = {}
        self._db_lock = Lock()

        if self._store_backend == "sqlite":
            self._ensure_sqlite_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self._sqlite_path)

    def _ensure_sqlite_schema(self) -> None:
        sqlite_file = Path(self._sqlite_path)
        sqlite_file.parent.mkdir(parents=True, exist_ok=True)
        with self._db_lock:
            with self._connect() as connection:
                connection.execute(
                    """
                    CREATE TABLE IF NOT EXISTS memories (
                        node_id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        content TEXT NOT NULL,
                        node_type TEXT NOT NULL,
                        vector_json TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    )
                    """
                )
                connection.execute("CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id)")
                connection.commit()

    def _sqlite_load_user_memories(self, user_id: str) -> list[MemoryItem]:
        with self._db_lock:
            with self._connect() as connection:
                rows = connection.execute(
                    "SELECT node_id, user_id, content, node_type, vector_json FROM memories WHERE user_id = ? ORDER BY created_at ASC",
                    (user_id,),
                ).fetchall()

        memories: list[MemoryItem] = []
        for node_id, row_user_id, content, node_type, vector_json in rows:
            vector = [float(value) for value in json.loads(vector_json)]
            memories.append(
                MemoryItem(
                    node_id=node_id,
                    user_id=row_user_id,
                    content=content,
                    node_type=node_type,
                    vector=vector,
                )
            )
        return memories

    def _sqlite_insert_memory(self, item: MemoryItem) -> None:
        with self._db_lock:
            with self._connect() as connection:
                connection.execute(
                    "INSERT INTO memories(node_id, user_id, content, node_type, vector_json, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))",
                    (
                        item.node_id,
                        item.user_id,
                        item.content,
                        item.node_type,
                        json.dumps(item.vector),
                    ),
                )
                connection.commit()

    def _load_user_memories(self, user_id: str) -> list[MemoryItem]:
        if self._store_backend == "sqlite":
            return self._sqlite_load_user_memories(user_id)
        return list(self._index.get(user_id, []))

    def _save_memory(self, item: MemoryItem) -> None:
        if self._store_backend == "sqlite":
            self._sqlite_insert_memory(item)
            return

        user_memories = self._index.setdefault(item.user_id, [])
        user_memories.append(item)

    def ingest(self, payload: MemoryIngestRequest) -> MemoryIngestResponse:
        vector = embedding_service.embed_text(payload.content)
        node_id = f"node-{uuid.uuid4().hex[:10]}"

        user_memories = self._load_user_memories(payload.user_id)
        related_node_ids = [
            item.node_id
            for item in user_memories
            if embedding_service.cosine_similarity(vector, item.vector) >= 0.74
        ][:5]

        item = MemoryItem(
            node_id=node_id,
            user_id=payload.user_id,
            content=payload.content,
            node_type=payload.node_type,
            vector=vector,
        )
        self._save_memory(item)

        strength_score = max(10.0, min(99.0, 35.0 + len(payload.content.strip()) * 0.8))
        return MemoryIngestResponse(
            node_id=node_id,
            embedding_stub=embedding_service.embedding_signature(payload.content),
            vector_dim=len(vector),
            strength_score=round(strength_score, 2),
            related_node_ids=related_node_ids,
            auto_connections_created=len(related_node_ids),
        )

    def retrieve(self, payload: MemoryQueryRequest) -> MemoryQueryResponse:
        user_memories = self._load_user_memories(payload.user_id)
        if not user_memories:
            return MemoryQueryResponse(user_id=payload.user_id, matches=[])

        query_vector = embedding_service.embed_text(payload.query)
        scored = []
        for item in user_memories:
            similarity = embedding_service.cosine_similarity(query_vector, item.vector)
            scored.append((similarity, item))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        matches = [
            MemoryMatch(
                node_id=item.node_id,
                content=item.content,
                node_type=item.node_type,
                score=round(max(0.0, score), 4),
            )
            for score, item in scored[: payload.top_k]
        ]
        return MemoryQueryResponse(user_id=payload.user_id, matches=matches)

    def runtime_status(self) -> dict[str, object]:
        if self._store_backend == "sqlite":
            with self._db_lock:
                with self._connect() as connection:
                    row = connection.execute("SELECT COUNT(*) FROM memories").fetchone()
            return {
                "backend": "sqlite",
                "sqlite_path": self._sqlite_path,
                "total_items": int(row[0] if row else 0),
            }

        total_items = sum(len(items) for items in self._index.values())
        return {
            "backend": "memory",
            "sqlite_path": None,
            "total_items": total_items,
        }


memory_service = MemoryService()
