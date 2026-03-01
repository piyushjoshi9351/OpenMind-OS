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
import type { GoalModel, GoalStatus, PaginationCursor } from '@/types';

const COLLECTION_NAME = 'goals';

const userGoalsCollection = (firestore: Firestore, userId: string) => collection(firestore, 'users', userId, COLLECTION_NAME);
const userGoalDoc = (firestore: Firestore, userId: string, goalId: string) => doc(firestore, 'users', userId, COLLECTION_NAME, goalId);

const toCursor = (snapshot: QueryDocumentSnapshot<DocumentData>): PaginationCursor => ({
  id: snapshot.id,
  createdAt: String(snapshot.get('createdAt') ?? ''),
});

const toGoal = (snapshot: QueryDocumentSnapshot<DocumentData>): GoalModel => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: String(data.userId ?? ''),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    category: data.category as GoalModel['category'],
    deadline: String(data.deadline ?? ''),
    priority: data.priority as GoalModel['priority'],
    status: (data.status as GoalStatus) ?? 'Pending',
    completionProbability: Number(data.completionProbability ?? 0),
    skillGapScore: Number(data.skillGapScore ?? 0),
    progress: Number(data.progress ?? 0),
    createdAt: String(data.createdAt ?? ''),
    updatedAt: String(data.updatedAt ?? ''),
    archivedAt: data.archivedAt ? String(data.archivedAt) : null,
  };
};

export interface GoalCreateInput {
  userId: string;
  title: string;
  description: string;
  category: GoalModel['category'];
  deadline: string;
  priority: GoalModel['priority'];
}

export interface GoalListResult {
  goals: GoalModel[];
  nextCursor: PaginationCursor | null;
}

export const goalService = {
  subscribeByUser(firestore: Firestore, userId: string, onData: (goals: GoalModel[]) => void, onError: (error: Error) => void) {
    const goalsQuery = query(userGoalsCollection(firestore, userId), orderBy('createdAt', 'desc'));
    return onSnapshot(
      goalsQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map(toGoal)
          .filter((goal) => goal.status !== 'Archived')
          .sort((firstGoal, secondGoal) => new Date(secondGoal.createdAt).getTime() - new Date(firstGoal.createdAt).getTime());
        onData(mapped);
      },
      (error) => onError(error),
    );
  },

  async listByUser(firestore: Firestore, userId: string, pageSize = 20, cursor?: PaginationCursor): Promise<GoalListResult> {
    const constraints = [
      orderBy('createdAt', 'desc'),
      limit(pageSize),
    ];

    const goalsQuery = cursor
      ? query(userGoalsCollection(firestore, userId), ...constraints, startAfter(cursor.createdAt, cursor.id))
      : query(userGoalsCollection(firestore, userId), ...constraints);

    const snapshot = await getDocs(goalsQuery);
    const goals = snapshot.docs.map(toGoal);
    const nextCursor = snapshot.docs.length >= pageSize ? toCursor(snapshot.docs[snapshot.docs.length - 1]) : null;
    return { goals, nextCursor };
  },

  async create(firestore: Firestore, input: GoalCreateInput): Promise<string> {
    const now = new Date().toISOString();
    const goalRef = await addDoc(userGoalsCollection(firestore, input.userId), {
      ...input,
      progress: 0,
      completionProbability: 50,
      skillGapScore: 50,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    });
    return goalRef.id;
  },

  async update(firestore: Firestore, userId: string, goalId: string, payload: Partial<Omit<GoalModel, 'id' | 'userId' | 'createdAt'>>) {
    await updateDoc(userGoalDoc(firestore, userId, goalId), {
      ...payload,
      updatedAt: new Date().toISOString(),
    });
  },

  async archive(firestore: Firestore, userId: string, goalId: string) {
    const now = new Date().toISOString();
    await updateDoc(userGoalDoc(firestore, userId, goalId), {
      status: 'Archived',
      archivedAt: now,
      updatedAt: now,
    });
  },

  async remove(firestore: Firestore, userId: string, goalId: string) {
    await deleteDoc(userGoalDoc(firestore, userId, goalId));
  },
};
