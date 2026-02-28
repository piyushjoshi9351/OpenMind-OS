import { Goal, Task, CognitiveMetrics, KnowledgeNode, KnowledgeEdge } from '@/types';

export const MOCK_GOALS: Goal[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Become a Senior AI Engineer',
    description: 'Master deep learning and system design.',
    category: 'Career',
    priority: 'High',
    status: 'In Progress',
    deadline: '2025-12-31',
    progress: 45,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Run a Marathon',
    description: 'Complete a full 42km run.',
    category: 'Health',
    priority: 'Medium',
    status: 'In Progress',
    deadline: '2025-06-15',
    progress: 20,
    createdAt: '2024-02-01',
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    goalId: '1',
    userId: 'user1',
    title: 'Complete Neural Networks Course',
    estimatedTime: 1200,
    actualTime: 800,
    completed: false,
    deadline: '2024-04-30',
    tags: ['Learning', 'AI'],
  },
  {
    id: 't2',
    goalId: '1',
    userId: 'user1',
    title: 'Implement Transformer from scratch',
    estimatedTime: 600,
    actualTime: 100,
    completed: false,
    deadline: '2024-05-15',
    tags: ['Coding', 'AI'],
  },
];

export const MOCK_METRICS: CognitiveMetrics = {
  consistencyScore: 88,
  burnoutRisk: 12,
  focusScore: 75,
  learningVelocity: 1.4,
  goalCompletionProbability: 82,
};

export const MOCK_GRAPH_DATA = {
  nodes: [
    { id: 'n1', label: 'AI Engineering', type: 'Goal' },
    { id: 'n2', label: 'Machine Learning', type: 'Topic' },
    { id: 'n3', label: 'Python', type: 'Skill' },
    { id: 'n4', label: 'Neural Networks', type: 'Topic' },
    { id: 'n5', label: 'PyTorch', type: 'Skill' },
  ] as KnowledgeNode[],
  links: [
    { source: 'n1', target: 'n2' },
    { source: 'n2', target: 'n3' },
    { source: 'n2', target: 'n4' },
    { source: 'n4', target: 'n5' },
  ] as any[],
};