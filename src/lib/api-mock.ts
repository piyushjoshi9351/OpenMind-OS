import {
  Goal,
  Task,
  CognitiveMetrics,
  KnowledgeNode,
  DashboardSnapshot,
  SkillGapAnalysis,
} from '@/types';

const now = new Date().toISOString();

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
    completionProbability: 82,
    skillGapScore: 38,
    progress: 45,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: now,
    archivedAt: null,
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
    completionProbability: 67,
    skillGapScore: 22,
    progress: 20,
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: now,
    archivedAt: null,
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
    createdAt: now,
    deadline: '2024-04-30',
    tags: ['Learning', 'AI'],
    subtasks: [
      { id: 'st-11', title: 'Finish CNN chapter', completed: true },
      { id: 'st-12', title: 'Take final project quiz', completed: false },
    ],
    order: 1,
  },
  {
    id: 't2',
    goalId: '1',
    userId: 'user1',
    title: 'Implement Transformer from scratch',
    estimatedTime: 600,
    actualTime: 100,
    completed: false,
    createdAt: now,
    deadline: '2024-05-15',
    tags: ['Coding', 'AI'],
    subtasks: [
      { id: 'st-21', title: 'Write attention block', completed: false },
      { id: 'st-22', title: 'Benchmark with sample dataset', completed: false },
    ],
    order: 2,
  },
];

export const MOCK_METRICS: CognitiveMetrics = {
  id: 'bm-user1',
  userId: 'user1',
  consistencyScore: 88,
  delayRatio: 0.26,
  burnoutRisk: 12,
  focusScore: 75,
  learningVelocity: 1.4,
  updatedAt: now,
};

export const MOCK_GRAPH_DATA = {
  nodes: [
    { id: 'n1', userId: 'user1', title: 'AI Engineering', type: 'goal', embeddingPlaceholder: 'v1', createdAt: now },
    { id: 'n2', userId: 'user1', title: 'Machine Learning', type: 'topic', embeddingPlaceholder: 'v1', createdAt: now },
    { id: 'n3', userId: 'user1', title: 'Python', type: 'skill', embeddingPlaceholder: 'v1', createdAt: now },
    { id: 'n4', userId: 'user1', title: 'Neural Networks', type: 'topic', embeddingPlaceholder: 'v1', createdAt: now },
    { id: 'n5', userId: 'user1', title: 'PyTorch', type: 'skill', embeddingPlaceholder: 'v1', createdAt: now },
  ] as KnowledgeNode[],
  links: [
    { source: 'n1', target: 'n2', relationType: 'depends_on' },
    { source: 'n2', target: 'n3', relationType: 'requires' },
    { source: 'n2', target: 'n4', relationType: 'contains' },
    { source: 'n4', target: 'n5', relationType: 'implemented_with' },
  ],
};

export const MOCK_DASHBOARD: DashboardSnapshot = {
  activeGoals: 2,
  completionProbability: 76,
  skillGapScore: 30,
  consistencyScore: 88,
  burnoutRisk: 12,
  focusScore: 75,
  weeklyProductivity: [
    { day: 'Mon', completedTasks: 4 },
    { day: 'Tue', completedTasks: 3 },
    { day: 'Wed', completedTasks: 7 },
    { day: 'Thu', completedTasks: 5 },
    { day: 'Fri', completedTasks: 8 },
    { day: 'Sat', completedTasks: 2 },
    { day: 'Sun', completedTasks: 3 },
  ],
  focusDistribution: [
    { label: 'Deep Work', value: 52 },
    { label: 'Learning', value: 28 },
    { label: 'Admin', value: 20 },
  ],
};

export const MOCK_SKILL_GAP: SkillGapAnalysis = {
  goalId: '1',
  goalTitle: 'Become a Senior AI Engineer',
  requiredSkills: ['Python', 'MLOps', 'PyTorch', 'System Design', 'Math'],
  existingSkills: ['Python', 'PyTorch'],
  missingSkills: ['MLOps', 'System Design', 'Math'],
  gapPercentage: 60,
  recommendations: [
    'Complete MLOps deployment mini-project',
    'Study scalable AI system architecture patterns',
    'Add weekly applied math revision block',
  ],
};