import uuid
from dataclasses import dataclass

from app.models.schemas import (
    MemoryIngestRequest,
    MemoryIngestResponse,
    MemoryMatch,
    MemoryQueryRequest,
    MemoryQueryResponse,
)
from app.services.embedding_service import embedding_service


@dataclass
class MemoryItem:
    node_id: str
    user_id: str
    content: str
    node_type: str
    vector: list[float]


class MemoryService:
    def __init__(self):
        self._index: dict[str, list[MemoryItem]] = {}

    def ingest(self, payload: MemoryIngestRequest) -> MemoryIngestResponse:
        vector = embedding_service.embed_text(payload.content)
        node_id = f"node-{uuid.uuid4().hex[:10]}"

        user_memories = self._index.setdefault(payload.user_id, [])
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
        user_memories.append(item)

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
        user_memories = self._index.get(payload.user_id, [])
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


memory_service = MemoryService()
