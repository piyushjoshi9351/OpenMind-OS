import {
  addDoc,
  collection,
  onSnapshot,
  query,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { GraphClusterInsight, GraphDataModel, KnowledgeEdgeModel, KnowledgeNodeModel } from '@/types';

const userNodesCollection = (firestore: Firestore, userId: string) => collection(firestore, 'users', userId, 'knowledgeNodes');
const userEdgesCollection = (firestore: Firestore, userId: string) => collection(firestore, 'users', userId, 'knowledgeEdges');

const toNode = (snapshot: QueryDocumentSnapshot<DocumentData>): KnowledgeNodeModel => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: String(data.userId ?? ''),
    type: data.type as KnowledgeNodeModel['type'],
    title: String(data.title ?? ''),
    embeddingPlaceholder: String(data.embeddingPlaceholder ?? ''),
    createdAt: String(data.createdAt ?? ''),
  };
};

const toEdge = (snapshot: QueryDocumentSnapshot<DocumentData>): KnowledgeEdgeModel => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    userId: String(data.userId ?? ''),
    sourceId: String(data.sourceId ?? ''),
    targetId: String(data.targetId ?? ''),
    relationType: String(data.relationType ?? 'related_to'),
    createdAt: String(data.createdAt ?? ''),
  };
};

export const graphService = {
  subscribeNodes(firestore: Firestore, userId: string, onData: (nodes: KnowledgeNodeModel[]) => void, onError: (error: Error) => void) {
    const nodesQuery = query(userNodesCollection(firestore, userId));
    return onSnapshot(
      nodesQuery,
      (snapshot) => onData(snapshot.docs.map(toNode)),
      (error) => onError(error),
    );
  },

  subscribeEdges(firestore: Firestore, userId: string, onData: (edges: KnowledgeEdgeModel[]) => void, onError: (error: Error) => void) {
    const edgesQuery = query(userEdgesCollection(firestore, userId));
    return onSnapshot(
      edgesQuery,
      (snapshot) => onData(snapshot.docs.map(toEdge)),
      (error) => onError(error),
    );
  },

  async createNode(firestore: Firestore, node: Omit<KnowledgeNodeModel, 'id' | 'createdAt'>) {
    await addDoc(userNodesCollection(firestore, node.userId), {
      ...node,
      createdAt: new Date().toISOString(),
    });
  },

  async createEdge(firestore: Firestore, edge: Omit<KnowledgeEdgeModel, 'id' | 'createdAt'>) {
    await addDoc(userEdgesCollection(firestore, edge.userId), {
      ...edge,
      createdAt: new Date().toISOString(),
    });
  },

  toGraphData(nodes: KnowledgeNodeModel[], edges: KnowledgeEdgeModel[]): GraphDataModel {
    return {
      nodes,
      links: edges.map((edge) => ({
        source: edge.sourceId,
        target: edge.targetId,
        relationType: edge.relationType,
      })),
    };
  },

  buildWeakClusterInsights(nodes: KnowledgeNodeModel[], edges: KnowledgeEdgeModel[]): GraphClusterInsight[] {
    const degreeMap = new Map<string, number>();

    nodes.forEach((node) => degreeMap.set(node.id, 0));
    edges.forEach((edge) => {
      degreeMap.set(edge.sourceId, (degreeMap.get(edge.sourceId) ?? 0) + 1);
      degreeMap.set(edge.targetId, (degreeMap.get(edge.targetId) ?? 0) + 1);
    });

    return nodes
      .filter((node) => node.type === 'skill')
      .map((node) => {
        const degree = degreeMap.get(node.id) ?? 0;
        return {
          id: node.id,
          title: node.title,
          weaknessScore: Math.max(0, 100 - degree * 20),
          nodeIds: [node.id],
        };
      })
      .sort((a, b) => b.weaknessScore - a.weaknessScore)
      .slice(0, 4);
  },
};
