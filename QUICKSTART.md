# OpenMind OS - Complete Setup Guide (5 Minutes)

> **Status**: ✅ Full system operational. All features integrated and working.

## What You're Getting

A complete AI-powered cognitive system with:
- ✅ **Personalized Learning Roadmaps** - AI generates week-by-week plans
- ✅ **Goal & Task Management** - Real-time sync with Firebase
- ✅ **Knowledge Graph** - Neo4j-backed knowledge representation
- ✅ **Predictions** - ML models predict goal success rates
- ✅ **Analytics** - Track cognitive metrics and behavior patterns

---

## Quick Start (Choose One)

### Option 1: Docker (Recommended - 2 minutes)

**Requires**: Docker & Docker Compose

```bash
cd OpenMind-OS
npm run dev:stack
```

That's it! Access:
- **Frontend**: http://localhost:9002
- **API Docs**: http://localhost:8000/docs

### Option 2: Manual Setup (5 minutes)

#### Terminal 1 - Frontend
```bash
npm install
npm run dev
```

#### Terminal 2 - Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Terminal 3 - Databases (if not using Docker)
```bash
# PostgreSQL
docker run -d --name postgres -e POSTGRES_PASSWORD=openmind -p 5432:5432 postgres

# Neo4j
docker run -d --name neo4j -p 7687:7687 neo4j
```

---

## Configuration (2 minutes)

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Go to **Project Settings** → **General**
4. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

### 3. Enable Firebase Auth
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** sign-in

### 4. Get Gemini API Key (Optional but Recommended)
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click **Get API Key**
3. Add to `.env.local`: `GEMINI_API_KEY=your-key`

### 5. Backend Configuration
Create `backend/.env`:
```env
BACKEND_ENV=development
BACKEND_PORT=8000
POSTGRES_URL=postgresql+psycopg://openmind:openmind@localhost:5432/openmind
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=openmindneo4j
GEMINI_API_KEY=your-gemini-key
ENABLE_ML_STUBS=false
```

---

## First Run Workflow

### 1. Sign Up
- Open http://localhost:9002
- Click **Sign Up**
- Use email or Google account

### 2. Create First Goal
- Navigate to **Goals**
- Click **+ New Goal**
- Fill in:
  - Title: "Learn AI Engineering"
  - Category: "Learning"
  - Deadline: 6 months from now
  - Priority: "High"

### 3. Generate Roadmap
- Navigate to **Roadmap**
- Click **Generate Roadmap**
- Enter:
  - Target Role: "AI Engineer"
  - Timeline: 6 months
  - Weekly Hours: 10
  - Learning Style: "Mixed"
  - Priority Skills: Python, PyTorch, LLMs

### 4. View Your Roadmap
- See week-by-week breakdown
- Each week has daily activities
- Click **Save** to track progress

### 5. Track Progress
- Navigate to **Analytics**
- See your cognitive metrics
- Track goals and task completion

---

## System Architecture

```
OpenMind OS
│
├─ Frontend (Next.js)
│  ├─ Auth Pages (Google, Email)
│  ├─ Goal Management
│  ├─ Roadmap Generator
│  ├─ Task Tracker
│  ├─ Knowledge Graph
│  └─ Analytics Dashboard
│
├─ Backend (FastAPI)
│  ├─ /ai/generate-roadmap → AI engine
│  ├─ /prediction/goal → ML model
│  ├─ /memory/* → Knowledge storage
│  ├─ /behavior/* → Analytics
│  └─ /events/* → User tracking
│
└─ Databases
   ├─ Firebase (Auth, Real-time sync)
   ├─ PostgreSQL (Events, behavior)
   └─ Neo4j (Knowledge graph)
```

---

## Key Features Walkthrough

### 1. AI Roadmap Generation
- Generates personalized learning plans
- 5 learning tracks: AI, Backend, Product, General, Custom
- Adapts to experience level and available time
- Daily activities with specific learning goals

### 2. Goal Prediction
- ML model predicts goal success rate
- Based on user behavior and goal characteristics
- Recommends optimizations

### 3. Knowledge Graph
- Store and connect learning concepts
- Find related topics automatically
- Build your personal knowledge base

### 4. Behavior Analytics
- Track focus, consistency, burnout risk
- Real-time metrics dashboard
- Week-over-week trends

### 5. Task Management
- Hierarchical tasks with subtasks
- Goal-linked task organization
- Progress tracking

---

## API Examples

### Generate Roadmap (Direct Call)
```bash
curl -X POST http://localhost:8000/api/v1/ai/generate-roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "targetRole": "AI Engineer",
    "timelineMonths": 6,
    "weeklyHours": 10,
    "preferredStyle": "mixed"
  }'
```

### Check System Health
```bash
curl http://localhost:8000/api/v1/health
```

### All Endpoints
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Troubleshooting

### Issue: "Cannot connect to backend"
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not, restart it
cd backend
uvicorn app.main:app --reload
```

### Issue: "Firebase credentials invalid"
```bash
# Verify .env.local has correct values from Firebase Console
cat .env.local

# Clear browser cache and reload
# Press Ctrl+Shift+Delete in browser
```

### Issue: "Database connection error"
```bash
# Check PostgreSQL
docker ps | grep postgres
docker logs postgres

# Check Neo4j
docker ps | grep neo4j
docker logs neo4j
```

### Issue: "Port already in use"
```bash
# Frontend (9002)
lsof -i :9002 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Backend (8000)
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## What Works Now ✅

| Feature | Status | Documentation |
|---------|--------|---|
| User Authentication | ✅ | [Auth Docs](./FRONTEND_INTEGRATION.md#setting-up-your-environment) |
| Goal Management | ✅ | [Goal Service](./FRONTEND_INTEGRATION.md#goalservice---goal-management) |
| Learning Roadmaps | ✅ | [Roadmap API](./backend/BACKEND_GUIDE.md#2-ai---generate-learning-roadmap) |
| Knowledge Graph | ✅ | [Neo4j Queries](./backend/app/db/neo4j.py) |
| Goal Prediction | ✅ | [Prediction API](./backend/BACKEND_GUIDE.md#9-prediction---predict-goal-success) |
| Behavioral Analytics | ✅ | [Analytics API](./backend/BACKEND_GUIDE.md#8-behavior---get-summary) |
| AI Orchestrator | ✅ | [Orchestrator](./backend/app/agents/orchestrator.py) |
| Task Management | ✅ | [Task Service](./FRONTEND_INTEGRATION.md#goalservice---goal-management) |
| Real-time Sync | ✅ | [Firestore](./src/firebase/) |
| ML Models | ✅ | [Models](./backend/app/services/) |

---

## Next Steps

1. **Customize Learning Tracks**
   - Edit `backend/app/services/roadmap_service.py`
   - Add new learning paths and skill definitions

2. **Add More Roles**
   - Update `TRACK_PLANS` in `backend/app/services/roadmap_service.py`
   - Add role detection logic

3. **Integrate More AI Models**
   - Use `GEMINI_API_KEY` for enhanced generation
   - Add custom training data for predictions

4. **Deploy to Production**
   - Use Docker containers
   - Set up CI/CD with GitHub Actions
   - Deploy to Vercel (frontend) + Railway/Render (backend)

---

## Documentation

- **Full System Overview**: [SYSTEM_FLOW.md](./SYSTEM_FLOW.md)
- **Backend Guide**: [backend/BACKEND_GUIDE.md](./backend/BACKEND_GUIDE.md)
- **Frontend Integration**: [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)
- **API Reference**: http://localhost:8000/docs (Swagger)

---

## Support & Help

### Getting Help
1. Check documentation files linked above
2. Review code examples in `src/` and `backend/`
3. Check error messages in browser console (F12)
4. Check backend logs: `docker logs openmind-backend` (if using Docker)

### Common Questions
- **Q: How do I reset my data?**
  A: Delete Firebase Firestore collection or PostgreSQL tables

- **Q: Can I use a different AI model?**
  A: Yes, update `GEMINI_API_KEY` or use Hugging Face models

- **Q: How do I add custom learning tracks?**
  A: Edit `TRACK_PLANS` in `backend/app/services/roadmap_service.py`

---

## Performance Tips

1. **For Development**: Keep `ENABLE_ML_STUBS=false` but expect slower inference
2. **For Production**: Set `PRELOAD_EMBEDDING_MODEL=true` and increase resources
3. **Database**: Ensure PostgreSQL and Neo4j have sufficient memory
4. **Frontend**: Use browser DevTools to identify slow components

---

## Project Status

✅ **COMPLETE & OPERATIONAL**

- All components integrated
- All APIs working
- ML models functioning
- Database connections established
- Real-time sync operational
- Error handling implemented
- Documentation comprehensive

**Version**: 0.1.0  
**Last Updated**: April 19, 2026

---

## Quick Links

- 🚀 [Start Backend](./backend/)
- 🎨 [Start Frontend](.)
- 📚 [System Architecture](./SYSTEM_FLOW.md)
- 🔌 [API Documentation](http://localhost:8000/docs)
- 🐳 [Docker Setup](./docker-compose.yml)

---

**Ready to build? Start with `npm run dev:stack` now! 🎉**
