import math

from app.core.config import get_settings


class EmbeddingService:
    def __init__(self, dimensions: int = 24):
        self.dimensions = dimensions

    def embed_text(self, content: str) -> list[float]:
        cleaned = content.strip().lower()
        if not cleaned:
            return [0.0] * self.dimensions

        buckets = [0.0] * self.dimensions
        for index, char in enumerate(cleaned):
            bucket_index = (ord(char) + index * 7) % self.dimensions
            buckets[bucket_index] += (ord(char) % 31 + 1) / 31

        norm = math.sqrt(sum(value * value for value in buckets)) or 1.0
        return [value / norm for value in buckets]

    def embedding_signature(self, content: str) -> str:
        settings = get_settings()
        return f"stub::{settings.embedding_model}::{self.dimensions}::{len(content)}"

    @staticmethod
    def cosine_similarity(left: list[float], right: list[float]) -> float:
        if not left or not right or len(left) != len(right):
            return 0.0
        return sum(left_item * right_item for left_item, right_item in zip(left, right))


embedding_service = EmbeddingService()
