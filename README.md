# OpenMind OS – Open Source AI-Powered Personal Cognitive Operating System

OpenMind OS is designed as a **personal AI cognitive twin**: a system that learns how a user thinks, plans, learns, and executes.

## Why this project exists

Most apps solve one slice only: tasks, notes, habits, or learning. OpenMind OS connects all of them into one intelligence layer.

## Cognitive Twin Capabilities (MVP + AI-ready)

- Memory Graph Engine (knowledge nodes + relationships)
- Cognitive Pattern Analyzer (focus, consistency, burnout signals)
- Goal Optimizer (adaptive plan recommendations)
- Skill Gap Analyzer (required vs current vs missing skills)
- Roadmap Generator (role + timeline to structured plan)
- Scenario Simulation (what-if risk and opportunity estimation)

## Stack

### Frontend
- Next.js App Router + TypeScript
- Tailwind CSS + Framer Motion
- Recharts + D3.js
- Firebase Auth + Firestore

### Backend
- FastAPI (`backend/`)
- PostgreSQL adapter + Neo4j adapter scaffold
- Modular services for memory, cognitive analysis, optimizer, simulation
- ML/embedding/RL integration-ready boundaries

### Infra
- Docker Compose (frontend + backend + postgres + neo4j)
- GitHub Actions CI for frontend typecheck + backend tests

## Monorepo Structure

- `src/` frontend app and UI modules
- `src/services` Firestore service layer
- `src/lib/api.ts` future FastAPI/ML integration client
- `backend/app/` FastAPI cognitive engine
- `backend/app/services/` cognitive domain services
- `backend/app/db/` postgres + neo4j adapters
- `.github/workflows/ci.yml` CI pipeline

## Quick Start

### Frontend only
```bash
npm install
npm run dev
```

### Full stack (docker)
```bash
npm run dev:stack
```

### Backend only
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Environment

1. Copy `.env.example` to `.env.local`
2. Copy `backend/.env.example` to `backend/.env`
3. Fill Firebase values and service credentials

## AI/ML Production Setup

1. In `backend/.env`, set:
	- `ENABLE_ML_STUBS=false`
	- `PRELOAD_EMBEDDING_MODEL=true`
2. Train and persist goal prediction model:
	- `cd backend`
	- `.venv\Scripts\python scripts/train_goal_model.py`
	- optional real data: `.venv\Scripts\python scripts/train_goal_model.py --dataset data/training/my_goal_training_data.csv --report-out data/training/goal_model_validation_report.json`
3. Start backend and verify runtime status:
	- `uvicorn app.main:app --reload --port 8000`
	- open `http://127.0.0.1:8000/api/v1/health`

`/api/v1/health` now reports dependency health plus active embedding and goal-prediction model status.

CI now validates frontend type/lint/build, backend tests, backend container build, and model-training artifact generation.

## Deployment Quality Gates

Run full deployment checks locally:

```bash
npm run predeploy:all
```

This enforces:

- frontend lint + typecheck + production build
- backend model training artifact generation
- backend predeploy artifact/metric validation

## Open Source Roadmap (next)

- Sentence Transformer embedding pipeline
- Neo4j traversal and memory-strength scoring
- LSTM behavior forecasting
- RL-based adaptive roadmap policy updates
- Multi-agent planner + critic loop
