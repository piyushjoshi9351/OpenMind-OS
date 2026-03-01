# OpenMind Backend

FastAPI service for OpenMind OS cognitive engine.

## Modules

- `memory`: knowledge ingestion and graph-memory linking
- `cognitive`: behavior profiling and cognitive scoring
- `optimizer`: adaptive goal optimization
- `simulation`: what-if pathway simulation

## Local Run

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Hardening Runtime

- `MEMORY_STORE_BACKEND=sqlite|memory` selects persistent or in-memory memory store.
- `MEMORY_SQLITE_PATH` controls sqlite memory file path.
- `ENABLE_ML_STUBS=true|false` toggles deterministic fallback embeddings.
- `PRELOAD_EMBEDDING_MODEL=true|false` controls model warmup at startup.

## ML Component Bootstrap

To pre-download and verify the sentence-transformer model:

```bash
python scripts/bootstrap_ml.py
```

## Next Integrations

- Sentence Transformer embedding pipeline
- Neo4j query engine for memory graph traversal
- RL policy updates for adaptive planning
- LSTM-based behavior forecasting
