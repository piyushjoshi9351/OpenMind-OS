# OpenMind OS Backend - Setup & API Guide

## Quick Start

```bash
# 1. Installation
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Configuration (.env file)
cp ../.env.example .env
# Edit .env with your credentials

# 3. Run Development Server
uvicorn app.main:app --reload --port 8000

# 4. View API Documentation
# Visit: http://localhost:8000/docs
```

## Environment Configuration

### Required Environment Variables

```env
# Server Configuration
BACKEND_ENV=development
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
BACKEND_CORS_ORIGINS=["http://localhost:9002"]

# Database: PostgreSQL
POSTGRES_URL=postgresql+psycopg://openmind:openmind@localhost:5432/openmind

# Database: Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=openmindneo4j

# AI/ML Configuration
ENABLE_ML_STUBS=false                           # Set to false for real ML
PRELOAD_EMBEDDING_MODEL=false                   # Set to true for production
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
GEMINI_API_KEY=your-gemini-api-key             # Required for Genkit

# Memory Configuration
MEMORY_STORE_BACKEND=sqlite                     # sqlite or memory
MEMORY_SQLITE_PATH=./.cache/openmind_memory.sqlite3

# ML Model Configuration
GOAL_PREDICTION_MODEL_PATH=./app/data/goal_prediction_model.json
GOAL_PREDICTION_MODEL_VERSION=goal_predictor_v2
```

## API Endpoints Reference

All endpoints are prefixed with `/api/v1`

### 1. Health Check

**GET /health**

Check system health and dependency status.

```bash
curl http://localhost:8000/api/v1/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-19T10:30:00Z",
  "dependencies": {
    "embedding_service": "ok",
    "memory_service": "ok",
    "postgres": "ok",
    "neo4j": "ok"
  }
}
```

---

### 2. AI - Generate Learning Roadmap

**POST /ai/generate-roadmap**

Generate a personalized learning roadmap.

**Request Body:**
```json
{
  "targetRole": "AI Engineer",
  "timelineMonths": 6,
  "experienceLevel": "intermediate",
  "weeklyHours": 10,
  "preferredStyle": "mixed",
  "prioritySkills": ["Python", "PyTorch"],
  "constraints": "Limited GPU access"
}
```

**Response:**
```json
{
  "roadmapTitle": "AI Engineer Optimized Learning Roadmap",
  "roadmapDescription": "A 6-month optimized plan...",
  "weeks": [
    {
      "weekNumber": 1,
      "weekSummary": "Week 1: Math + Foundations...",
      "dailyTasks": [
        {
          "day": "Day 1",
          "topic": "Math + Foundations • Linear Algebra",
          "activities": ["Build and ship...", "Solve 8-10 focused problems..."]
        }
      ]
    }
  ]
}
```

---

### 3. Memory - Ingest Knowledge

**POST /memory/ingest**

Store a knowledge node with embeddings.

**Request Body:**
```json
{
  "user_id": "user-123",
  "content": "Linear Algebra is the mathematical foundation for machine learning",
  "node_type": "concept"
}
```

**Response:**
```json
{
  "node_id": "node-abc123",
  "embedding_stub": "Linear Algebra is the...",
  "vector_dim": 384,
  "strength_score": 82.5,
  "related_node_ids": ["node-def456", "node-ghi789"],
  "auto_connections_created": 2
}
```

---

### 4. Memory - Retrieve Knowledge

**POST /memory/retrieve**

Query similar knowledge nodes.

**Request Body:**
```json
{
  "user_id": "user-123",
  "query": "machine learning fundamentals",
  "top_k": 5
}
```

**Response:**
```json
{
  "user_id": "user-123",
  "matches": [
    {
      "node_id": "node-abc123",
      "content": "Linear Algebra is the foundation...",
      "node_type": "concept",
      "score": 0.8956
    }
  ]
}
```

---

### 5. Events - Track Event

**POST /events/track**

Log a user event (page view, click, etc.).

**Request Body:**
```json
{
  "user_id": "user-123",
  "event_type": "page_view",
  "metadata": {
    "page": "goals",
    "timestamp": "2026-04-19T10:30:00Z"
  }
}
```

---

### 6. Events - Get Summary

**GET /events/summary?user_id=user-123**

Get event analytics summary.

**Response:**
```json
{
  "user_id": "user-123",
  "total_events": 145,
  "event_types": {
    "page_view": 89,
    "goal_created": 12,
    "task_completed": 44
  },
  "top_pages": ["goals", "roadmap", "analytics"],
  "drop_off_analysis": "30% drop-off on day 3 (investigate engagement)"
}
```

---

### 7. Behavior - Track Behavior

**POST /behavior/track**

Log behavioral metrics.

**Request Body:**
```json
{
  "user_id": "user-123",
  "focus_score": 78,
  "consistency_score": 82,
  "goal_id": "goal-456"
}
```

---

### 8. Behavior - Get Summary

**GET /behavior/summary?user_id=user-123**

Get behavioral analytics.

**Response:**
```json
{
  "user_id": "user-123",
  "consistency_score": 82.5,
  "focus_score": 78.3,
  "burnout_risk": 0.2,
  "engagement_trend": "improving"
}
```

---

### 9. Prediction - Predict Goal Success

**POST /prediction/goal**

Predict goal completion probability.

**Request Body:**
```json
{
  "user_id": "user-123",
  "goal_id": "goal-456",
  "features": {
    "goal_title": "Learn PyTorch",
    "timeline_days": 90,
    "consistency_score": 75,
    "estimated_difficulty": 0.6
  }
}
```

**Response:**
```json
{
  "goal_id": "goal-456",
  "probabilities": {
    "goal-456": 0.82
  },
  "completion_probability": 0.82,
  "confidence": 0.91,
  "recommendation": "Maintain current pace",
  "risk_factors": []
}
```

---

### 10. Skill Gap - Analyze Skills

**POST /skill-gap/analyze**

Analyze required vs. existing skills.

**Request Body:**
```json
{
  "user_id": "user-123",
  "target_role": "AI Engineer"
}
```

**Response:**
```json
{
  "target_role": "AI Engineer",
  "required_skills": ["Python", "PyTorch", "Statistics", "Linear Algebra"],
  "skill_gaps": [
    {
      "skill": "PyTorch",
      "proficiency": 0.2,
      "gap": 0.8
    }
  ],
  "readiness_score": 0.65,
  "priority_skills": ["PyTorch", "Statistics"]
}
```

---

### 11. Simulation - Scenario Analysis

**POST /simulation/scenario**

Run what-if scenario simulations.

**Request Body:**
```json
{
  "user_id": "user-123",
  "goal_id": "goal-456",
  "scenario": {
    "weekly_hours": 12,
    "consistency": 0.85,
    "difficulty_adjustment": 1.1
  }
}
```

**Response:**
```json
{
  "scenario_id": "sim-123",
  "success_probability": 0.87,
  "expected_weeks": 18,
  "confidence_interval": [0.81, 0.93]
}
```

---

### 12. ML Insights - Composite Analysis

**POST /ml-insights/analyze**

Get composite ML analysis across multiple models.

**Request Body:**
```json
{
  "user_id": "user-123",
  "goal_id": "goal-456"
}
```

**Response:**
```json
{
  "user_id": "user-123",
  "goal_id": "goal-456",
  "readiness_score": 0.75,
  "components": {
    "behavioral_readiness": 0.8,
    "skill_readiness": 0.65,
    "prediction_confidence": 0.85
  },
  "recommendations": [
    "Focus on skill building",
    "Maintain consistency"
  ]
}
```

---

### 13. Cognitive - User Profile

**GET /cognitive/profile?user_id=user-123**

Get cognitive profile and learning metrics.

**Response:**
```json
{
  "user_id": "user-123",
  "learning_velocity": 1.2,
  "focus_consistency": 82,
  "preferred_learning_style": "mixed",
  "cognitive_load": 0.72,
  "recommendations": ["Increase break frequency", "Reduce daily load"]
}
```

---

### 14. Optimizer - Goal Optimization

**POST /optimizer/goal**

Get optimization recommendations for a goal.

**Request Body:**
```json
{
  "user_id": "user-123",
  "goal_id": "goal-456"
}
```

**Response:**
```json
{
  "goal_id": "goal-456",
  "optimizations": [
    {
      "type": "timeline_adjustment",
      "suggestion": "Extend by 2 weeks for higher success",
      "impact": "Increases success from 82% to 91%"
    }
  ],
  "priority_actions": ["Schedule daily sessions", "Find study partner"]
}
```

---

## Running with Docker

### Option 1: Full Stack with Docker Compose

From project root:

```bash
# Build and run all services
npm run dev:stack

# Includes: Frontend, Backend, PostgreSQL, Neo4j
# Access:
# - Frontend: http://localhost:9002
# - Backend: http://localhost:8000
# - Swagger: http://localhost:8000/docs
```

### Option 2: Backend Only

```bash
# From project root
cd backend

# With Docker (if you have Docker)
docker build -t openmind-backend .
docker run -p 8000:8000 \
  -e POSTGRES_URL="postgresql+psycopg://user:pass@postgres:5432/openmind" \
  -e NEO4J_URI="bolt://neo4j:7687" \
  -e GEMINI_API_KEY="your-key" \
  openmind-backend

# Or directly with Python
uvicorn app.main:app --reload --port 8000
```

---

## Testing

### Run Backend Tests

```bash
cd backend

# All tests
pytest

# Specific test
pytest tests/test_ai_endpoints.py

# With coverage
pytest --cov=app

# Watch mode (with pytest-watch)
ptw
```

### Test Health Endpoint

```bash
curl http://localhost:8000/api/v1/health | python -m json.tool
```

### Test Roadmap Generation

```bash
curl -X POST http://localhost:8000/api/v1/ai/generate-roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "targetRole": "AI Engineer",
    "timelineMonths": 3,
    "weeklyHours": 10
  }' | python -m json.tool
```

---

## Database Management

### PostgreSQL

```bash
# Connect to PostgreSQL
docker exec -it openmind-postgres psql -U openmind -d openmind

# Common queries
SELECT COUNT(*) FROM memories;
SELECT COUNT(*) FROM events;
```

### Neo4j

```bash
# Connect to Neo4j
docker exec -it openmind-neo4j bash

# Run Cypher queries
cypher-shell

# Query: Count knowledge nodes
MATCH (k:Knowledge) RETURN COUNT(k) as total;

# Query: Find all skill nodes
MATCH (s:Knowledge {category: "skill"}) RETURN s.content;
```

---

## Performance Optimization

### 1. Enable Model Preloading

```env
PRELOAD_EMBEDDING_MODEL=true
```

Loads sentence-transformers model on startup (slower startup, faster queries).

### 2. Disable ML Stubs (for real predictions)

```env
ENABLE_ML_STUBS=false
```

Warning: Requires trained model file to exist.

### 3. SQLite Memory Mode (faster, non-persistent)

```env
MEMORY_STORE_BACKEND=memory
```

### 4. Database Indexing

```sql
-- Create indexes for faster queries
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_memories_user_id ON memories(user_id);
```

---

## Common Issues & Solutions

### Issue: "Module not found: app"
**Solution:**
```bash
pip install -e .
```

### Issue: "PostgreSQL connection refused"
**Solution:**
```bash
# Ensure database is running
docker ps

# Check containers
docker logs openmind-postgres
```

### Issue: "GEMINI_API_KEY not set"
**Solution:**
```bash
# Add to .env
GEMINI_API_KEY=sk-your-gemini-key

# Restart server
```

### Issue: "Neo4j connection refused"
**Solution:**
```bash
# Ensure Neo4j is running
docker exec openmind-neo4j cypher-shell -u neo4j "RETURN 1"

# Check Neo4j browser at http://localhost:7474
```

### Issue: "Embedding model not downloading"
**Solution:**
```bash
# Try manually downloading with Python
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

---

## Deployment Checklist

- [ ] Set `BACKEND_ENV=production`
- [ ] Set `ENABLE_ML_STUBS=false` (use real ML)
- [ ] Set `PRELOAD_EMBEDDING_MODEL=true` (warmup models)
- [ ] Configure secure `BACKEND_CORS_ORIGINS`
- [ ] Use strong Neo4j password
- [ ] Set `GEMINI_API_KEY` from production account
- [ ] Verify database backups configured
- [ ] Load test with production data volume
- [ ] Enable monitoring and logging
- [ ] Set resource limits in Docker

---

## Support

- **Swagger API Docs**: http://localhost:8000/docs
- **ReDoc API Docs**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json
- **Project README**: ../README.md
- **System Flow**: ../SYSTEM_FLOW.md
