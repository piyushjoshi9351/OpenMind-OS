# OpenMind OS - System Flow & Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Flow](#user-flow)
3. [Technical Architecture](#technical-architecture)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Data Models](#data-models)
7. [Setup Instructions](#setup-instructions)

---

## System Overview

OpenMind OS is a full-stack AI-powered personal cognitive system that helps users:
- **Generate personalized learning roadmaps** using AI
- **Track goals and tasks** with real-time sync
- **Analyze cognitive patterns** from behavioral data
- **Predict goal completion** using ML models
- **Manage knowledge** in a personal knowledge graph

### Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| User Authentication | ✅ | Firebase email/Google OAuth |
| Goal Management | ✅ | Create, track, and organize learning goals |
| Learning Roadmaps | ✅ | AI-generated personalized learning plans |
| Task Management | ✅ | Hierarchical tasks with subtasks |
| Knowledge Graph | ✅ | Neo4j-backed knowledge representation |
| Behavioral Analytics | ✅ | Track and analyze user behavior |
| ML Predictions | ✅ | Goal completion probability predictions |
| Cognitive Insights | ✅ | Real-time cognitive metrics |

---

## User Flow

### 1. Onboarding Flow

```
User Signup/Login
  ↓
Create First Goal
  ↓
Generate Learning Roadmap
  ↓
Browse Roadmap Weeks/Days
  ↓
Start Learning Journey
```

**Steps:**
1. User signs up with email or Google account (Firebase)
2. User creates their first learning goal (title, category, deadline, priority)
3. System suggests a learning roadmap based on selected goal
4. Roadmap shows week-by-week breakdown with daily activities
5. User saves roadmap to their profile
6. User tracks progress on dashboard

### 2. Daily Usage Flow

```
User Opens Dashboard
  ↓
View Today's Tasks
  ↓
Track Behavior/Events
  ↓
View Insights
  ↓
Update Progress
```

**Components & Actions:**
- **Dashboard**: Overview of active goals and roadmaps
- **Tasks Page**: View today's learning activities
- **Analytics Page**: See cognitive metrics and insights
- **Roadmap Page**: Track progress, mark weeks complete
- **Graph View**: Explore connected knowledge topics

### 3. Backend Processing Flow

```
Frontend User Action
  ↓
POST to Backend API
  ↓
Process & Store Data
  ↓
Generate Insights
  ↓
Return Response
  ↓
Update Frontend UI
```

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  Pages: Auth, Dashboard, Goals, Tasks, Roadmap, Graph  │
│  Services: Goal, Task, Roadmap, Analytics, Memory      │
│  UI: Radix Components, Framer Motion, D3 Visualizations│
└──────────────────────────┬──────────────────────────────┘
                           │ API Calls
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                     │
│  Routes: Health, AI, Memory, Events, Behavior, etc.    │
│  Services: Roadmap, ML Predictions, Embeddings         │
│  Database Integration: PostgreSQL, Neo4j, SQLite       │
└──────────────────────────┬──────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
    Firebase          PostgreSQL            Neo4j
    (Auth/Data)       (Events, Behavior)   (Knowledge Graph)
```

### Frontend Architecture

**Pages:**
- `(auth)/login` - Authentication
- `(dashboard)/` - Main dashboard
- `(dashboard)/goals` - Goal management
- `(dashboard)/tasks` - Task list
- `(dashboard)/roadmap` - Learning roadmap view
- `(dashboard)/graph` - Knowledge graph visualization
- `(dashboard)/analytics` - Cognitive metrics
- `(dashboard)/profile` - User settings

**Services:**
- `goalService` - Goal CRUD + Firestore sync
- `taskService` - Task management + hierarchies
- `roadmapService` - Roadmap generation + Firebase storage
- `analyticsService` - Metrics aggregation
- `graphService` - Knowledge graph queries
- `intelligenceService` - AI features

### Backend Architecture

**API Router:**
```
/api/v1/
├── health/                 → System status
├── ai/
│   └── generate-roadmap/   → AI roadmap generation
├── memory/
│   ├── ingest/            → Store knowledge node
│   └── retrieve/          → Query knowledge
├── events/
│   ├── track/             → Log user events
│   └── summary/           → Event analytics
├── behavior/
│   ├── track/             → Log behavior metrics
│   └── summary/           → Behavior analysis
├── cognitive/
│   └── profile/           → Cognitive metrics
├── prediction/
│   └── goal/              → Goal success prediction
├── optimizer/
│   └── goal/              → Goal recommendations
├── skill-gap/
│   └── analyze/           → Required vs. existing skills
├── simulation/
│   └── scenario/          → What-if scenarios
└── ml-insights/
    └── analyze/           → Composite ML analysis
```

---

## API Endpoints

### Generate Learning Roadmap

**Endpoint:** `POST /api/v1/ai/generate-roadmap`

**Request:**
```json
{
  "targetRole": "AI Engineer",
  "timelineMonths": 6,
  "experienceLevel": "intermediate",
  "weeklyHours": 10,
  "preferredStyle": "mixed",
  "prioritySkills": ["Python", "PyTorch", "LLMs"],
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
          "activities": [
            "Build and ship one practical artifact...",
            "Solve 8-10 focused problems..."
          ]
        }
      ]
    }
  ]
}
```

### Save Roadmap

**Endpoint:** `POST` (Frontend Firestore)

**Process:**
1. Call `/api/v1/ai/generate-roadmap` 
2. Store response in Firestore collection `users/{userId}/roadmaps/`
3. Return roadmap ID

### Track Behavioral Event

**Endpoint:** `POST /api/v1/events/track`

**Request:**
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

### Get Goal Prediction

**Endpoint:** `POST /api/v1/prediction/goal`

**Request:**
```json
{
  "user_id": "user-123",
  "goal_id": "goal-456",
  "features": {
    "consistency_score": 75.5,
    "focus_hours": 12,
    "estimated_difficulty": 0.6
  }
}
```

**Response:**
```json
{
  "goal_id": "goal-456",
  "completion_probability": 0.82,
  "confidence": 0.91,
  "recommendation": "Maintain current pace"
}
```

---

## Frontend Components

### Roadmap Generation Flow

**Component Highway:**
1. **RoadmapGeneratorForm** - Input form for roadmap parameters
2. **RoadmapPreview** - Show generated roadmap preview
3. **SaveRoadmapDialog** - Confirm and save to Firestore
4. **RoadmapCard** - Display saved roadmaps

**Key Props:**
- `targetRole` - Desired job role
- `timelineMonths` - Duration of roadmap
- `weeklyHours` - Available learning hours
- `prioritySkills` - Focus areas

### Dashboard Components

**ActiveRoadmaps:**
- Shows current week and progress
- Allow marking weeks as complete
- Quick access to daily activities

**GoalTracker:**
- Real-time goal status
- Prediction probability badges
- Skill gap indicators

**AnalyticsDashboard:**
- Cognitive metrics visualizations
- Behavior trends
- Insights cards

---

## Data Models

### Roadmap Model (Firestore)

```typescript
interface RoadmapModel {
  id: string;
  userId: string;
  roadmapTitle: string;
  roadmapDescription: string;
  weeks: WeekPlan[];
  
  // Input parameters
  targetRole: string;
  timelineMonths: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  weeklyHours: number;
  preferredStyle: 'project' | 'theory' | 'mixed';
  prioritySkills: string[];
  constraints?: string;
  
  // Tracking fields
  status: 'draft' | 'active' | 'completed' | 'archived';
  currentWeek: number;
  completedWeeks: number[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### Goal Model (Firestore)

```typescript
interface GoalModel {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'learning' | 'project' | 'skill' | 'habit';
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  
  // Analytics
  completionProbability: number; // 0-100
  skillGapScore: number; // 0-100
  progress: number; // 0-100
  status: 'Pending' | 'Active' | 'Completed' | 'Archived';
  
  createdAt: string;
  updatedAt: string;
}
```

### Knowledge Node (Neo4j)

```
(:Knowledge {
  id: string,
  content: string,
  category: string,
  embedding: [float],
  metadata: object,
  updatedAt: datetime
})
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- Firebase account
- Google Cloud account (for Gemini API)

### 1. Environment Setup

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abc
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

#### Backend (.env)
```bash
BACKEND_ENV=development
BACKEND_PORT=8000
POSTGRES_URL=postgresql+psycopg://openmind:openmind@localhost:5432/openmind
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=openmindneo4j
GEMINI_API_KEY=your-gemini-api-key
ENABLE_ML_STUBS=false
```

### 2. Start Development Stack

```bash
# Full stack with Docker
npm run dev:stack

# Or individually:
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run dev:backend

# Terminal 3: Genkit Dev UI (optional)
npm run genkit:dev
```

### 3. Access Services

- **Frontend**: http://localhost:9002
- **Backend API Docs**: http://localhost:8000/docs
- **Genkit Dashboard** (if running): http://localhost:3000

### 4. Run Tests

```bash
# Backend tests
npm run test:backend

# E2E tests
npm run test:e2e

# Pre-deployment checks
npm run predeploy:all
```

---

## Common Workflows

### Generate and Save a Roadmap

**Frontend Code:**
```typescript
import { roadmapService } from '@/services';
import { useFirestore } from '@/firebase';

// 1. Generate roadmap
const roadmap = await roadmapService.generate({
  userId: user.uid,
  targetRole: 'AI Engineer',
  timelineMonths: 6,
  weeklyHours: 10,
  preferredStyle: 'mixed'
});

// 2. Save to Firestore
const roadmapId = await roadmapService.save(
  firestore,
  { userId: user.uid, targetRole: 'AI Engineer', ... },
  roadmap
);
```

### Track User Event

**Backend Triggered by Frontend:**
```typescript
// Frontend: Track page view
await fetch('http://localhost:8000/api/v1/events/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    event_type: 'page_view',
    metadata: { page: 'roadmap' }
  })
});
```

### Get Goal Prediction

**Frontend Code:**
```typescript
const prediction = await fetch(
  'http://localhost:8000/api/v1/prediction/goal',
  { method: 'POST', body: JSON.stringify({ user_id, goal_id, features }) }
);
const result = await prediction.json();
console.log(`Success probability: ${result.completion_probability * 100}%`);
```

---

## Troubleshooting

### "Roadmap Generation Fails"
- Check `GEMINI_API_KEY` is set in backend .env
- Verify `NEXT_PUBLIC_ML_API_URL` points to backend
- Check backend logs: `docker logs openmind-backend`

### "Firebase Auth Not Working"
- Verify Firebase credentials in `.env.local`
- Check Firebase console has email/Google auth enabled
- Clear browser localStorage and retry

### "Port Already in Use"
```bash
# Frontend port 9002
lsof -i :9002 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Backend port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### "Database Connection Errors"
```bash
# Check PostgreSQL
docker exec openmind-postgres psql -U openmind -d openmind -c "SELECT 1"

# Check Neo4j
docker exec openmind-neo4j cypher-shell -u neo4j "RETURN 1"
```

---

## Performance Tips

1. **ML Stubs**: Keep `ENABLE_ML_STUBS=false` for production
2. **Preload Embeddings**: Set `PRELOAD_EMBEDDING_MODEL=true` for faster inference
3. **Caching**: Use Firestore real-time listeners instead of polling
4. **Pagination**: Use cursor-based pagination for large goal/roadmap lists

---

## Support & Documentation

- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Frontend Types**: See `src/types/` for all TypeScript interfaces
- **Services**: See `src/services/` for usage examples
- **Tests**: See `backend/tests/` and `tests/e2e/` for examples

---

**Last Updated**: April 19, 2026
**Version**: 0.1.0
