# OpenMind OS Frontend - Integration Guide

## Overview

The frontend is a Next.js 15 application that integrates with:
- **Firebase**: Authentication and real-time data storage
- **Backend API**: AI/ML features and analytics
- **Local Services**: Data transformation and UI logic

---

## Frontend Architecture

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   │   └── login/         # Login/signup page
│   ├── (dashboard)/       # Main application pages (requires auth)
│   │   ├── page.tsx       # Dashboard home
│   │   ├── goals/         # Goal management
│   │   ├── tasks/         # Task list
│   │   ├── roadmap/       # Learning roadmaps
│   │   ├── graph/         # Knowledge graph
│   │   ├── analytics/     # Cognitive analytics
│   │   ├── profile/       # User profile
│   │   └── settings/      # Settings
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
│
├── components/            # React components
│   ├── FirebaseErrorListener.tsx  # Global error handling
│   ├── ai/               # AI-related components
│   ├── dashboard/        # Dashboard components
│   ├── graph/            # Graph visualization
│   ├── landing/          # Landing page components
│   └── ui/               # Radix UI components
│
├── services/             # Business logic
│   ├── goalService.ts
│   ├── taskService.ts
│   ├── roadmapService.ts
│   ├── analyticsService.ts
│   ├── graphService.ts
│   └── index.ts
│
├── types/                # TypeScript interfaces
│   ├── goal.ts
│   ├── task.ts
│   ├── roadmap.ts
│   ├── user.ts
│   └── index.ts
│
├── lib/                  # Utilities
│   ├── api.ts           # API client
│   ├── auth.ts          # Auth helpers
│   ├── firebase.ts      # Firebase utilities
│   └── utils.ts
│
└── firebase/            # Firebase configuration
    ├── config.ts
    ├── client-provider.tsx
    └── index.ts
```

---

## Setting Up Your Environment

### 1. Install Dependencies

```bash
npm install
```

### 2. Create .env.local

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:your-app-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend API
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

### 3. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing
3. Enable Authentication (Email/Google)
4. Create a Firestore database
5. Copy credentials to .env.local

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002)

---

## Core Services Guide

### goalService - Goal Management

**Subscribe to User Goals (Real-time):**

```typescript
import { goalService } from '@/services';
import { useFirestore } from '@/firebase';

export function GoalsList() {
  const firestore = useFirestore();
  const [goals, setGoals] = useState([]);
  
  useEffect(() => {
    const unsubscribe = goalService.subscribeByUser(
      firestore,
      userId,
      (goals) => setGoals(goals),
      (error) => console.error('Error:', error)
    );
    
    return unsubscribe;
  }, [firestore, userId]);
  
  return (
    <ul>
      {goals.map(goal => (
        <li key={goal.id}>{goal.title}</li>
      ))}
    </ul>
  );
}
```

**Create a New Goal:**

```typescript
import { goalService } from '@/services';

async function createGoal(userId, goalData) {
  const goalId = await goalService.create(firestore, {
    userId,
    title: 'Learn PyTorch',
    description: 'Master PyTorch for deep learning',
    category: 'learning',
    deadline: '2026-10-19',
    priority: 'high'
  });
  
  console.log('Goal created:', goalId);
}
```

**Update Goal Progress:**

```typescript
await goalService.update(firestore, userId, goalId, {
  progress: 50,
  completionProbability: 85
});
```

---

### roadmapService - Learning Roadmaps

**Generate a Roadmap:**

```typescript
import { roadmapService } from '@/services';

async function generateRoadmap(userId) {
  try {
    const roadmap = await roadmapService.generate({
      userId,
      targetRole: 'AI Engineer',
      timelineMonths: 6,
      experienceLevel: 'intermediate',
      weeklyHours: 10,
      preferredStyle: 'mixed',
      prioritySkills: ['Python', 'PyTorch', 'Transformers']
    });
    
    console.log('Roadmap generated:', roadmap);
    return roadmap;
  } catch (error) {
    console.error('Failed to generate roadmap:', error);
  }
}
```

**Save Roadmap to Firestore:**

```typescript
async function saveRoadmap(userId, roadmapInput) {
  const roadmapId = await roadmapService.saveFromGeneration(
    firestore,
    {
      userId,
      targetRole: 'AI Engineer',
      timelineMonths: 6,
      // ... other parameters
    }
  );
  
  console.log('Roadmap saved:', roadmapId);
  return roadmapId;
}
```

**Subscribe to Saved Roadmaps:**

```typescript
useEffect(() => {
  const unsubscribe = roadmapService.subscribeByUser(
    firestore,
    userId,
    (roadmaps) => setRoadmaps(roadmaps),
    (error) => console.error('Error:', error)
  );
  
  return unsubscribe;
}, [firestore, userId]);
```

**Track Roadmap Progress:**

```typescript
async function completeWeek(userId, roadmapId, weekNumber) {
  await roadmapService.completeWeek(
    firestore,
    userId,
    roadmapId,
    weekNumber
  );
}
```

---

### Calling Backend API Directly

**Track Event:**

```typescript
async function trackPageView(userId, page) {
  await fetch('http://localhost:8000/api/v1/events/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      event_type: 'page_view',
      metadata: { page, timestamp: new Date().toISOString() }
    })
  });
}
```

**Get Goal Prediction:**

```typescript
async function getPrediction(userId, goalId) {
  const response = await fetch('http://localhost:8000/api/v1/prediction/goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      goal_id: goalId,
      features: {
        consistency_score: 75,
        focus_hours: 10,
        estimated_difficulty: 0.5
      }
    })
  });
  
  const prediction = await response.json();
  return prediction.completion_probability; // 0.82
}
```

**Get Skill Gap Analysis:**

```typescript
async function getSkillGaps(userId, targetRole) {
  const response = await fetch('http://localhost:8000/api/v1/skill-gap/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      target_role: targetRole
    })
  });
  
  return await response.json();
}
```

---

## Component Examples

### RoadmapGenerator Component

```typescript
'use client';

import { useState } from 'react';
import { roadmapService } from '@/services';
import { useFirestore, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RoadmapGenerator() {
  const { user } = useAuth();
  const firestore = useFirestore();
  
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [timelineMonths, setTimelineMonths] = useState(6);
  
  async function handleGenerate() {
    setLoading(true);
    try {
      const roadmapId = await roadmapService.saveFromGeneration(firestore, {
        userId: user.uid,
        targetRole,
        timelineMonths,
        experienceLevel: 'intermediate',
        weeklyHours: 10
      });
      
      alert(`Roadmap generated: ${roadmapId}`);
    } catch (error) {
      alert('Failed to generate roadmap: ' + error.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="space-y-4 p-6">
      <Input
        placeholder="Target Role (e.g., AI Engineer)"
        value={targetRole}
        onChange={(e) => setTargetRole(e.target.value)}
      />
      
      <Input
        type="number"
        placeholder="Timeline (months)"
        value={timelineMonths}
        onChange={(e) => setTimelineMonths(Number(e.target.value))}
      />
      
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Roadmap'}
      </Button>
    </div>
  );
}
```

### Goal Tracker Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { goalService } from '@/services';
import { useFirestore, useAuth } from '@/firebase';

export function GoalTracker() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [goals, setGoals] = useState([]);
  
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = goalService.subscribeByUser(
      firestore,
      user.uid,
      setGoals,
      (error) => console.error('Error loading goals:', error)
    );
    
    return unsubscribe;
  }, [firestore, user]);
  
  return (
    <div>
      <h2>My Goals</h2>
      {goals.length === 0 ? (
        <p>No goals yet. Create one to get started!</p>
      ) : (
        <ul>
          {goals.map(goal => (
            <li key={goal.id}>
              <div>{goal.title}</div>
              <div>Progress: {goal.progress}%</div>
              <div>Success: {goal.completionProbability}%</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

---

## API Integration Best Practices

### 1. Error Handling

```typescript
async function safeAPICall(endpoint, options) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_ML_API_URL}${endpoint}`,
      options
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

async function fetchData() {
  setLoading(true);
  setError(null);
  
  try {
    const data = await safeAPICall('/api/v1/endpoint');
    // Process data
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}
```

### 3. Caching with SWR

```typescript
import useSWR from 'swr';

function usePrediction(goalId) {
  const { data, error } = useSWR(
    goalId ? `/api/v1/prediction/goal/${goalId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  
  return { prediction: data, isLoading: !data && !error, error };
}
```

---

## Common Integration Patterns

### Pattern 1: Load Data on Mount

```typescript
useEffect(() => {
  loadData();
}, []); // Empty dependency array = mount only
```

### Pattern 2: Reactive Updates

```typescript
useEffect(() => {
  if (!userId) return;
  
  const unsubscribe = goalService.subscribeByUser(
    firestore,
    userId,
    setGoals,
    setError
  );
  
  return unsubscribe; // Cleanup
}, [firestore, userId]);
```

### Pattern 3: Form Submission

```typescript
async function handleSubmit(e) {
  e.preventDefault();
  
  try {
    setLoading(true);
    await roadmapService.saveFromGeneration(firestore, formData);
    // Navigate or show success
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

---

## Testing Components

### Unit Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { GoalTracker } from '@/components/GoalTracker';

jest.mock('@/firebase', () => ({
  useFirestore: () => mockFirestore,
  useAuth: () => ({ user: { uid: 'user-123' } })
}));

test('displays goals list', async () => {
  render(<GoalTracker />);
  
  await waitFor(() => {
    expect(screen.getByText('My Goals')).toBeInTheDocument();
  });
});
```

---

## Debugging Tips

### 1. Check Network Requests

```typescript
// Add to any API call
console.log('Calling:', endpoint, options);

// Or use browser DevTools Network tab
```

### 2. Debug Firebase

```typescript
import { enableLogging } from 'firebase/firestore';

enableLogging(true); // Very verbose!
```

### 3. React DevTools

Install React Developer Tools browser extension to inspect component state and props.

---

## Performance Optimization

### 1. Code Splitting

```typescript
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/Chart'), {
  loading: () => <div>Loading chart...</div>
});
```

### 2. Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/image.png"
  alt="Description"
  width={200}
  height={200}
/>
```

### 3. Memoization

```typescript
import { useMemo, useCallback } from 'react';

const memoizedValue = useMemo(() => compute(data), [data]);
const memoizedCallback = useCallback((arg) => callback(arg), []);
```

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Radix UI Components](https://www.radix-ui.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks](https://react.dev/reference/react/hooks)

---

## Support

- Check `SYSTEM_FLOW.md` for complete system overview
- Check `backend/BACKEND_GUIDE.md` for API documentation
- Review existing components in `src/components/` for patterns
