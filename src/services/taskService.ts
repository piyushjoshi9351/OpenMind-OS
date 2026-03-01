import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Subtask, TaskModel } from '@/types';

const COLLECTION_NAME = 'tasks';

const userTasksCollectionGroup = (firestore: Firestore) => collectionGroup(firestore, COLLECTION_NAME);
const goalTasksCollection = (firestore: Firestore, userId: string, goalId: string) => collection(firestore, 'users', userId, 'goals', goalId, COLLECTION_NAME);
const taskDocRef = (firestore: Firestore, userId: string, goalId: string, taskId: string) => doc(firestore, 'users', userId, 'goals', goalId, COLLECTION_NAME, taskId);

const toTask = (snapshot: QueryDocumentSnapshot<DocumentData>): TaskModel => {
  const data = snapshot.data();
  const subtasks = Array.isArray(data.subtasks) ? data.subtasks as Subtask[] : [];
  return {
    id: snapshot.id,
    goalId: String(data.goalId ?? ''),
    userId: String(data.userId ?? ''),
    title: String(data.title ?? ''),
    estimatedTime: Number(data.estimatedTime ?? 0),
    actualTime: Number(data.actualTime ?? 0),
    completed: Boolean(data.completed ?? false),
    createdAt: String(data.createdAt ?? ''),
    deadline: String(data.deadline ?? ''),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    subtasks,
    order: Number(data.order ?? 0),
  };
};

export interface TaskCreateInput {
  userId: string;
  goalId: string;
  title: string;
  estimatedTime: number;
  deadline: string;
  tags: string[];
}

export const taskService = {
  subscribeByUser(firestore: Firestore, userId: string, onData: (tasks: TaskModel[]) => void, onError: (error: Error) => void) {
    const tasksQuery = query(userTasksCollectionGroup(firestore), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(
      tasksQuery,
      (snapshot) => {
        const mapped = snapshot.docs
          .map(toTask)
          .sort((leftTask, rightTask) => {
            if (leftTask.completed !== rightTask.completed) {
              return Number(leftTask.completed) - Number(rightTask.completed);
            }
            if (leftTask.order !== rightTask.order) {
              return leftTask.order - rightTask.order;
            }
            return new Date(leftTask.deadline).getTime() - new Date(rightTask.deadline).getTime();
          });
        onData(mapped);
      },
      (error) => onError(error),
    );
  },

  async create(firestore: Firestore, input: TaskCreateInput) {
    const createdAt = new Date().toISOString();
    await addDoc(goalTasksCollection(firestore, input.userId, input.goalId), {
      ...input,
      actualTime: 0,
      completed: false,
      createdAt,
      subtasks: [],
      order: Date.now(),
    });
  },

  async update(
    firestore: Firestore,
    userId: string,
    goalId: string,
    taskId: string,
    payload: Partial<Omit<TaskModel, 'id' | 'userId' | 'goalId' | 'createdAt'>>,
  ) {
    await updateDoc(taskDocRef(firestore, userId, goalId, taskId), payload);
  },

  async toggleCompleted(firestore: Firestore, userId: string, goalId: string, taskId: string, completed: boolean) {
    await updateDoc(taskDocRef(firestore, userId, goalId, taskId), { completed });
  },

  async bulkUpdateCompleted(
    firestore: Firestore,
    userId: string,
    updates: Array<{ taskId: string; goalId: string; completed: boolean }>,
  ) {
    const batch = writeBatch(firestore);
    updates.forEach(({ taskId, goalId, completed }) => {
      batch.update(taskDocRef(firestore, userId, goalId, taskId), { completed });
    });
    await batch.commit();
  },

  async reorder(
    firestore: Firestore,
    userId: string,
    orderedTasks: Array<{ taskId: string; goalId: string }>,
  ) {
    const batch = writeBatch(firestore);
    orderedTasks.forEach(({ taskId, goalId }, index) => {
      batch.update(taskDocRef(firestore, userId, goalId, taskId), { order: index + 1 });
    });
    await batch.commit();
  },
};
