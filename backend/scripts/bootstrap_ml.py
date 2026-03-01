from __future__ import annotations

from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.config import get_settings


def main() -> None:
    settings = get_settings()
    print(f"Preparing embedding model: {settings.embedding_model}")

    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(settings.embedding_model)
    sample_vector = model.encode("openmind backend bootstrap", normalize_embeddings=True)
    print(f"Model ready. Vector length: {len(sample_vector)}")


if __name__ == "__main__":
    main()
