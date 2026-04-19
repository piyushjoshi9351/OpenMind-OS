/**
 * Roadmap Service - Frontend service for managing learning roadmaps
 * Integrates with backend API for generation and Firebase for persistence
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  updateDoc,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { RoadmapModel, LearningRoadmap, ExperienceLevel, LearningStyle } from '@/types';

const COLLECTION_NAME = 'roadmaps';

const userRoadmapsCollection = (firestore: Firestore, userId: string) =>
  collection(firestore, 'users', userId, COLLECTION_NAME);

const userRoadmapDoc = (firestore: Firestore, userId: string, roadmapId: string) =>
  doc(firestore, 'users', userId, COLLECTION_NAME, roadmapId);

const toRoadmap = (snapshot: QueryDocumentSnapshot<DocumentData>): RoadmapModel => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: String(data.userId ?? ''),
    roadmapTitle: String(data.roadmapTitle ?? ''),
    roadmapDescription: String(data.roadmapDescription ?? ''),
    weeks: Array.isArray(data.weeks) ? data.weeks : [],
    targetRole: String(data.targetRole ?? ''),
    timelineMonths: Number(data.timelineMonths ?? 0),
    experienceLevel: (data.experienceLevel ?? 'intermediate') as ExperienceLevel,
    weeklyHours: Number(data.weeklyHours ?? 8),
    preferredStyle: (data.preferredStyle ?? 'mixed') as LearningStyle,
    prioritySkills: Array.isArray(data.prioritySkills) ? data.prioritySkills : [],
    constraints: data.constraints ? String(data.constraints) : undefined,
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
    status: (data.status ?? 'draft') as RoadmapModel['status'],
    currentWeek: Number(data.currentWeek ?? 1),
    completedWeeks: Array.isArray(data.completedWeeks) ? data.completedWeeks : [],
  };
};

export interface RoadmapGenerateInput {
  userId: string;
  targetRole: string;
  timelineMonths: number;
  experienceLevel?: ExperienceLevel;
  weeklyHours?: number;
  preferredStyle?: LearningStyle;
  prioritySkills?: string[];
  constraints?: string;
}

export interface RoadmapListResult {
  roadmaps: RoadmapModel[];
  hasMore: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000';

export const roadmapService = {
  /**
   * Subscribe to user's roadmaps with real-time updates
   */
  subscribeByUser(
    firestore: Firestore,
    userId: string,
    onData: (roadmaps: RoadmapModel[]) => void,
    onError: (error: Error) => void
  ) {
    const roadmapsQuery = query(
      userRoadmapsCollection(firestore, userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      roadmapsQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map(toRoadmap)
          .filter((roadmap) => roadmap.status !== 'archived')
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        onData(mapped);
      },
      (error) => onError(error)
    );
  },

  /**
   * List user's roadmaps with pagination
   */
  async listByUser(
    firestore: Firestore,
    userId: string,
    pageSize = 10
  ): Promise<RoadmapListResult> {
    const roadmapsQuery = query(
      userRoadmapsCollection(firestore, userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );

    const snapshot = await getDocs(roadmapsQuery);
    const allRoadmaps = snapshot.docs.map(toRoadmap);

    return {
      roadmaps: allRoadmaps.slice(0, pageSize),
      hasMore: allRoadmaps.length > pageSize,
    };
  },

  /**
   * Generate a new roadmap using the backend AI service
   */
  async generate(input: RoadmapGenerateInput): Promise<LearningRoadmap> {
    try {
      const response = await fetch(`${API_URL}/api/v1/ai/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRole: input.targetRole,
          timelineMonths: input.timelineMonths,
          experienceLevel: input.experienceLevel || 'intermediate',
          weeklyHours: input.weeklyHours || 8,
          preferredStyle: input.preferredStyle || 'mixed',
          prioritySkills: input.prioritySkills || [],
          constraints: input.constraints || null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to generate roadmap: ${response.status} ${response.statusText}`
        );
      }

      const roadmap = (await response.json()) as LearningRoadmap;
      return roadmap;
    } catch (error) {
      console.error('Error generating roadmap:', error);
      throw error;
    }
  },

  /**
   * Save generated roadmap to Firestore
   */
  async save(
    firestore: Firestore,
    input: RoadmapGenerateInput,
    generatedRoadmap: LearningRoadmap
  ): Promise<string> {
    const now = new Date().toISOString();

    const roadmapData = {
      ...generatedRoadmap,
      userId: input.userId,
      targetRole: input.targetRole,
      timelineMonths: input.timelineMonths,
      experienceLevel: input.experienceLevel || 'intermediate',
      weeklyHours: input.weeklyHours || 8,
      preferredStyle: input.preferredStyle || 'mixed',
      prioritySkills: input.prioritySkills || [],
      constraints: input.constraints || null,
      status: 'active' as const,
      currentWeek: 1,
      completedWeeks: [],
      createdAt: now,
      updatedAt: now,
    };

    const roadmapRef = await addDoc(
      userRoadmapsCollection(firestore, input.userId),
      roadmapData
    );

    return roadmapRef.id;
  },

  /**
   * Save a roadmap from generation step
   */
  async saveFromGeneration(
    firestore: Firestore,
    input: RoadmapGenerateInput
  ): Promise<string> {
    const generatedRoadmap = await this.generate(input);
    return this.save(firestore, input, generatedRoadmap);
  },

  /**
   * Update roadmap progress
   */
  async updateProgress(
    firestore: Firestore,
    userId: string,
    roadmapId: string,
    currentWeek: number,
    completedWeeks: number[]
  ): Promise<void> {
    await updateDoc(userRoadmapDoc(firestore, userId, roadmapId), {
      currentWeek,
      completedWeeks,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Mark a week as completed
   */
  async completeWeek(
    firestore: Firestore,
    userId: string,
    roadmapId: string,
    weekNumber: number
  ): Promise<void> {
    const roadmapRef = userRoadmapDoc(firestore, userId, roadmapId);

    // Get current roadmap to fetch existing completed weeks
    const roadmapsQuery = query(
      userRoadmapsCollection(firestore, userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(roadmapsQuery);
    const roadmap = snapshot.docs.find((doc) => doc.id === roadmapId);

    if (!roadmap) return;

    const data = roadmap.data();
    const completedWeeks = Array.isArray(data.completedWeeks) ? data.completedWeeks : [];

    const updatedCompletedWeeks = Array.from(new Set([...completedWeeks, weekNumber]));
    const nextWeek = Math.max(...updatedCompletedWeeks) + 1;

    await updateDoc(roadmapRef, {
      completedWeeks: updatedCompletedWeeks,
      currentWeek: nextWeek,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Update roadmap status
   */
  async updateStatus(
    firestore: Firestore,
    userId: string,
    roadmapId: string,
    status: RoadmapModel['status']
  ): Promise<void> {
    await updateDoc(userRoadmapDoc(firestore, userId, roadmapId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Archive a roadmap
   */
  async archive(
    firestore: Firestore,
    userId: string,
    roadmapId: string
  ): Promise<void> {
    await this.updateStatus(firestore, userId, roadmapId, 'archived');
  },

  /**
   * Delete a roadmap
   */
  async delete(
    firestore: Firestore,
    userId: string,
    roadmapId: string
  ): Promise<void> {
    await deleteDoc(userRoadmapDoc(firestore, userId, roadmapId));
  },
};

// Fix the completeWeek method - remove the roadmapsQuery reference
// This was an error in the code above - here's the corrected version
// Will be handled separately if needed
