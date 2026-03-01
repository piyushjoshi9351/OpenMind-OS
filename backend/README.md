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

## Next Integrations

- Sentence Transformer embedding pipeline
- Neo4j query engine for memory graph traversal
- RL policy updates for adaptive planning
- LSTM-based behavior forecasting
