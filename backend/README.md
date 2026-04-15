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

To train and persist the goal prediction model artifact used by `/api/v1/prediction/goal`:

```bash
python scripts/train_goal_model.py
```

This creates `app/data/goal_prediction_model.json` (or your configured `GOAL_PREDICTION_MODEL_PATH`).

For training on historical exported behavior/task features:

```bash
python scripts/train_goal_model.py --dataset data/training/my_goal_training_data.csv --report-out data/training/goal_model_validation_report.json
```

Dataset CSV format (required columns):

- `consistency_score`
- `delay_ratio`
- `completion_velocity`
- `active_hours`
- `label` (0 or 1)

Validation report includes ROC-AUC, F1, precision, recall, accuracy, Brier score, log loss, and expected calibration error (ECE).

To generate training CSV from exported telemetry (tasks/goals/metrics JSON):

```bash
python scripts/build_training_dataset.py --tasks-json data/exports/tasks.json --goals-json data/exports/goals.json --metrics-json data/exports/metrics.json --out-csv data/training/generated_goal_training_data.csv
```

Then train from that generated dataset:

```bash
python scripts/train_goal_model.py --dataset data/training/generated_goal_training_data.csv --report-out data/training/goal_model_validation_report.json
```

Run strict deployment checks:

```bash
python scripts/predeploy_check.py --strict
```

## Deployment Notes

- Set `ENABLE_ML_STUBS=false` for real sentence-transformer embeddings.
- Set `PRELOAD_EMBEDDING_MODEL=true` to warm models during startup.
- Persist `GOAL_PREDICTION_MODEL_PATH` as part of your image or mounted volume.
- Use `/api/v1/health` to verify dependency, embedding, memory, and ML runtime status.

## Next Integrations

- Sentence Transformer embedding pipeline
- Neo4j query engine for memory graph traversal
- RL policy updates for adaptive planning
- LSTM-based behavior forecasting
