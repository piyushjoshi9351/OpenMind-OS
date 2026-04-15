'use server';
/**
 * @fileOverview A deterministic server-side flow for generating a personalized learning roadmap.
 *
 * - generateLearningRoadmap - A function that generates a learning roadmap based on a target role and timeline.
 * - GenerateLearningRoadmapInput - The input type for the generateLearningRoadmap function.
 * - GenerateLearningRoadmapOutput - The return type for the generateLearningRoadmap function.
 */

import {z} from 'genkit';

const GenerateLearningRoadmapInputSchema = z.object({
  targetRole: z.string().describe('The desired target job role (e.g., "AI Engineer", "Full-stack Developer").'),
  timelineMonths: z.number().int().min(1).describe('The desired timeline in months for the learning roadmap.'),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe('Current proficiency level.'),
  weeklyHours: z.number().int().min(1).max(60).optional().describe('Hours available per week.'),
  preferredStyle: z.enum(['project', 'theory', 'mixed']).optional().describe('Preferred learning style.'),
  prioritySkills: z.array(z.string()).max(8).optional().describe('Priority skills to focus on.'),
  constraints: z.string().max(500).optional().describe('Any constraints or context to consider.'),
});
export type GenerateLearningRoadmapInput = z.infer<typeof GenerateLearningRoadmapInputSchema>;

const GenerateLearningRoadmapOutputSchema = z.object({
  roadmapTitle: z.string().describe('A title for the generated learning roadmap.'),
  roadmapDescription: z.string().describe('An overall description of the learning roadmap and its objectives.'),
  weeks: z.array(z.object({
    weekNumber: z.number().int().min(1).describe('The sequential number of the week in the roadmap.'),
    weekSummary: z.string().describe('A brief summary of the learning goals or topics for this week.'),
    dailyTasks: z.array(z.object({
      day: z.string().describe('The specific day within the week (e.g., "Day 1", "Monday").'),
      topic: z.string().describe('The main topic or skill to focus on for this day.'),
      activities: z.array(z.string()).describe('A list of suggested learning activities or tasks for the day.'),
    })).describe('A breakdown of suggested tasks for each day of the week.'),
  })).describe('A weekly breakdown of the learning roadmap.'),
});
export type GenerateLearningRoadmapOutput = z.infer<typeof GenerateLearningRoadmapOutputSchema>;

const WEEKDAY_LABELS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
const MAX_WEEKS = 24;

const STYLE_ACTIVITY: Record<'project' | 'theory' | 'mixed', string> = {
  project: 'Build and ship one practical artifact tied to this topic.',
  theory: 'Deep-dive core concepts and create concise summary notes.',
  mixed: 'Split session into concept review + practical implementation.',
};

type TrackPlan = {
  name: string;
  topics: string[];
  activities: string[];
};

const TRACKS: Record<'ai' | 'backend' | 'product' | 'general', TrackPlan[]> = {
  ai: [
    {
      name: 'Math + Foundations',
      topics: ['Linear Algebra', 'Probability', 'Optimization', 'Statistics'],
      activities: [
        'Solve 8-10 focused problems and note mistakes.',
        'Summarize one concept in your own words in a notes file.',
        'Implement one tiny concept demo in Python notebook.',
      ],
    },
    {
      name: 'ML Core',
      topics: ['Regression', 'Classification', 'Feature Engineering', 'Validation'],
      activities: [
        'Train one small model and compare metrics.',
        'Write experiment log: hypothesis → result → next step.',
        'Refactor data preprocessing into reusable functions.',
      ],
    },
    {
      name: 'Deep Learning + LLM',
      topics: ['Neural Nets', 'Transformers', 'Fine-tuning', 'Evaluation'],
      activities: [
        'Implement one architecture block from scratch.',
        'Run one benchmark and explain failure cases.',
        'Build a mini retrieval or prompt pipeline.',
      ],
    },
    {
      name: 'MLOps + System Design',
      topics: ['Serving', 'Monitoring', 'CI/CD', 'Scalability'],
      activities: [
        'Containerize one model service and test locally.',
        'Define latency/cost metrics and dashboard checklist.',
        'Design one production architecture diagram.',
      ],
    },
    {
      name: 'Portfolio + Interview Prep',
      topics: ['Case Studies', 'Behavioral Stories', 'DSA for AI Roles', 'Mock Interview'],
      activities: [
        'Ship one portfolio project milestone.',
        'Prepare STAR stories aligned to staff-level impact.',
        'Do one mock interview and iterate weak areas.',
      ],
    },
  ],
  backend: [
    {
      name: 'Language + Fundamentals',
      topics: ['Language Mastery', 'Data Structures', 'Error Handling', 'Testing'],
      activities: ['Build one robust utility module.', 'Write tests for core paths.', 'Document conventions and patterns.'],
    },
    {
      name: 'API + Data Layer',
      topics: ['REST/GraphQL', 'SQL Design', 'Caching', 'Transactions'],
      activities: ['Implement one production-grade endpoint.', 'Optimize one query path.', 'Add input validation and failure handling.'],
    },
    {
      name: 'System Design',
      topics: ['Scalability', 'Queues', 'Consistency', 'Observability'],
      activities: ['Design one high-scale service.', 'Add metrics/logging checklist.', 'Run load assumptions and bottleneck review.'],
    },
    {
      name: 'Deployment + Reliability',
      topics: ['CI/CD', 'Infra', 'Rollback', 'SLOs'],
      activities: ['Set up deployment pipeline.', 'Create runbook for incidents.', 'Track error budgets and alerts.'],
    },
    {
      name: 'Portfolio + Interview Prep',
      topics: ['Project Narrative', 'Trade-off Discussion', 'Mock Design'],
      activities: ['Publish one strong backend project.', 'Practice trade-off articulation.', 'Do timed design mock sessions.'],
    },
  ],
  product: [
    {
      name: 'Problem Discovery',
      topics: ['User Research', 'JTBD', 'Problem Framing'],
      activities: ['Run user interview notes synthesis.', 'Draft one PRD problem statement.', 'Define measurable outcomes.'],
    },
    {
      name: 'Execution Systems',
      topics: ['Roadmapping', 'Prioritization', 'Stakeholder Alignment'],
      activities: ['Create prioritized backlog.', 'Plan one sprint with dependencies.', 'Communicate scope trade-offs.'],
    },
    {
      name: 'Metrics + Experimentation',
      topics: ['North Star', 'Funnels', 'A/B Tests'],
      activities: ['Define metric hierarchy.', 'Design one experiment.', 'Review experiment readout template.'],
    },
    {
      name: 'Leadership + Communication',
      topics: ['Narratives', 'Decision Memos', 'Cross-team Execution'],
      activities: ['Write one decision memo.', 'Present roadmap update.', 'Run alignment review.'],
    },
    {
      name: 'Interview Prep + Cases',
      topics: ['Product Sense', 'Execution', 'Leadership'],
      activities: ['Solve one case daily.', 'Refine leadership examples.', 'Mock interviews and feedback loop.'],
    },
  ],
  general: [
    {
      name: 'Core Fundamentals',
      topics: ['Concepts', 'Tools', 'Practice'],
      activities: ['Study focused concept block.', 'Build one micro project.', 'Document outcomes and next step.'],
    },
    {
      name: 'Skill Building',
      topics: ['Intermediate Skills', 'Problem Solving', 'Review'],
      activities: ['Solve targeted challenges.', 'Refactor previous work.', 'Track progress with weekly review.'],
    },
    {
      name: 'Applied Projects',
      topics: ['Project Architecture', 'Implementation', 'Quality'],
      activities: ['Ship one project milestone.', 'Add testing and monitoring.', 'Publish project notes.'],
    },
    {
      name: 'Delivery + Communication',
      topics: ['Planning', 'Execution', 'Stakeholder updates'],
      activities: ['Create execution timeline.', 'Run weekly checkpoint.', 'Share concise progress update.'],
    },
    {
      name: 'Readiness + Interviews',
      topics: ['Portfolio', 'Mock Interviews', 'Gap Closure'],
      activities: ['Prepare showcase artifacts.', 'Run mock interviews.', 'Close top 3 skill gaps.'],
    },
  ],
};

const detectTrack = (roleLower: string): keyof typeof TRACKS => {
  if (roleLower.includes('ai') || roleLower.includes('ml') || roleLower.includes('data') || roleLower.includes('llm')) {
    return 'ai';
  }

  if (roleLower.includes('backend') || roleLower.includes('api') || roleLower.includes('platform')) {
    return 'backend';
  }

  if (roleLower.includes('product') || roleLower.includes('pm')) {
    return 'product';
  }

  return 'general';
};

const buildFallbackRoadmap = (input: GenerateLearningRoadmapInput): GenerateLearningRoadmapOutput => {
  const cleanRole = input.targetRole.trim();
  const roleLower = cleanRole.toLowerCase();
  const totalWeeks = Math.min(MAX_WEEKS, Math.max(4, input.timelineMonths * 4));
  const selectedTrack = TRACKS[detectTrack(roleLower)];
  const experienceLevel = input.experienceLevel ?? 'intermediate';
  const weeklyHours = Math.max(1, Math.min(60, input.weeklyHours ?? 8));
  const preferredStyle = input.preferredStyle ?? 'mixed';
  const prioritySkills = (input.prioritySkills ?? []).map((skill) => skill.trim()).filter(Boolean);
  const constraints = input.constraints?.trim();
  const intensityLabel = weeklyHours >= 14 ? 'high-intensity' : weeklyHours >= 8 ? 'balanced' : 'light';
  const dailyTaskDepth = weeklyHours >= 14 ? 4 : weeklyHours >= 8 ? 3 : 2;

  const weeks = Array.from({ length: totalWeeks }, (_, index) => {
    const weekNumber = index + 1;
    const stage = selectedTrack[Math.min(selectedTrack.length - 1, Math.floor(index / Math.max(1, Math.ceil(totalWeeks / selectedTrack.length))))];
    const topic = stage.topics[index % stage.topics.length];
    const priorityFocus = prioritySkills.length ? prioritySkills[index % prioritySkills.length] : null;

    const baseActivities = [
      STYLE_ACTIVITY[preferredStyle],
      stage.activities[(index + 0) % stage.activities.length],
      stage.activities[(index + 1) % stage.activities.length],
      `Role alignment checkpoint: connect today's work to ${cleanRole} expectations.`,
    ];

    if (constraints) {
      baseActivities.push(`Constraint-aware adjustment: ${constraints}.`);
    }

    const dailyTasks = WEEKDAY_LABELS.map((day, dayIndex) => ({
      day,
      topic: `${stage.name} • ${priorityFocus ? `${priorityFocus} + ` : ''}${topic}`,
      activities: baseActivities.slice(dayIndex % 2, (dayIndex % 2) + dailyTaskDepth),
    }));

    return {
      weekNumber,
      weekSummary: `Week ${weekNumber}: ${stage.name} (${experienceLevel} track, ${intensityLabel} load) with emphasis on ${priorityFocus ? `${priorityFocus} and ` : ''}${topic}.`,
      dailyTasks,
    };
  });

  return {
    roadmapTitle: `${cleanRole} Optimized Learning Roadmap`,
    roadmapDescription: `A ${input.timelineMonths}-month optimized plan for becoming ${cleanRole}, tailored for ${experienceLevel} level, ${weeklyHours} hrs/week, and ${preferredStyle} learning style.${prioritySkills.length ? ` Priority focus: ${prioritySkills.join(', ')}.` : ''}`,
    weeks,
  };
};

export async function generateLearningRoadmap(input: GenerateLearningRoadmapInput): Promise<GenerateLearningRoadmapOutput> {
  const safeInput = GenerateLearningRoadmapInputSchema.parse(input);
  return buildFallbackRoadmap(safeInput);
}
