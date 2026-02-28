'use server';
/**
 * @fileOverview A Genkit flow for generating a personalized learning roadmap.
 *
 * - generateLearningRoadmap - A function that generates a learning roadmap based on a target role and timeline.
 * - GenerateLearningRoadmapInput - The input type for the generateLearningRoadmap function.
 * - GenerateLearningRoadmapOutput - The return type for the generateLearningRoadmap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLearningRoadmapInputSchema = z.object({
  targetRole: z.string().describe('The desired target job role (e.g., "AI Engineer", "Full-stack Developer").'),
  timelineMonths: z.number().int().min(1).describe('The desired timeline in months for the learning roadmap.'),
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

export async function generateLearningRoadmap(input: GenerateLearningRoadmapInput): Promise<GenerateLearningRoadmapOutput> {
  return generateLearningRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLearningRoadmapPrompt',
  input: {schema: GenerateLearningRoadmapInputSchema},
  output: {schema: GenerateLearningRoadmapOutputSchema},
  prompt: `You are an expert career coach and learning specialist. Your task is to create a detailed, personalized learning roadmap to help a user achieve a specific target job role within a given timeline.\n\nThe roadmap should be structured weekly, with daily task suggestions. Be comprehensive and realistic, breaking down complex skills into manageable steps.\n\nTarget Role: {{{targetRole}}}\nTimeline: {{{timelineMonths}}} months\n\nGenerate the learning roadmap in the specified JSON format. Ensure all fields are populated and the structure strictly adheres to the output schema.\nThe number of weeks should correspond to the timeline in months (e.g., 1 month = 4 weeks, 3 months = 12 weeks).\nFor daily tasks, label days as "Day 1", "Day 2", etc., or specific days of the week (e.g., "Monday", "Tuesday").\n`,
});

const generateLearningRoadmapFlow = ai.defineFlow(
  {
    name: 'generateLearningRoadmapFlow',
    inputSchema: GenerateLearningRoadmapInputSchema,
    outputSchema: GenerateLearningRoadmapOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate learning roadmap.');
    }
    return output;
  }
);
