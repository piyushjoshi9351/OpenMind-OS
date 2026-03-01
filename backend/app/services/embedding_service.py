import math

from app.core.config import get_settings


class EmbeddingService:
    def __init__(self, dimensions: int = 24):
        self.dimensions = dimensions
        self._model = None
        self._model_load_failed = False

    def _get_model(self):
        if self._model is not None:
            return self._model
        if self._model_load_failed:
            return None

        try:
            from sentence_transformers import SentenceTransformer

            settings = get_settings()
            self._model = SentenceTransformer(settings.embedding_model)
            return self._model
        except Exception:
            self._model_load_failed = True
            return None

    def embed_text(self, content: str) -> list[float]:
        cleaned = content.strip().lower()
        if not cleaned:
            return [0.0] * self.dimensions

        model = self._get_model()
        if model is not None:
            vector = model.encode(cleaned, normalize_embeddings=True)
            return [float(value) for value in vector]

        buckets = [0.0] * self.dimensions
        for index, char in enumerate(cleaned):
            bucket_index = (ord(char) + index * 7) % self.dimensions
            buckets[bucket_index] += (ord(char) % 31 + 1) / 31

        norm = math.sqrt(sum(value * value for value in buckets)) or 1.0
        return [value / norm for value in buckets]

    def embedding_signature(self, content: str) -> str:
        settings = get_settings()
        prefix = "sbert" if self._get_model() is not None else "stub"
        return f"{prefix}::{settings.embedding_model}::{self.dimensions}::{len(content)}"

    @staticmethod
    def cosine_similarity(left: list[float], right: list[float]) -> float:
        if not left or not right or len(left) != len(right):
            return 0.0
        return sum(left_item * right_item for left_item, right_item in zip(left, right))


embedding_service = EmbeddingService()
