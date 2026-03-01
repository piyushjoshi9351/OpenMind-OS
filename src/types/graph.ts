import type { ISODateString } from '@/types/common';

export type KnowledgeNodeType = 'skill' | 'topic' | 'goal' | 'note';

export interface KnowledgeNodeModel {
  id: string;
  userId: string;
  type: KnowledgeNodeType;
  title: string;
  embeddingPlaceholder: string;
  createdAt: ISODateString;
}

export interface KnowledgeEdgeModel {
  id: string;
  userId: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  createdAt: ISODateString;
}

export interface GraphClusterInsight {
  id: string;
  title: string;
  weaknessScore: number;
  nodeIds: string[];
}

export interface GraphDataModel {
  nodes: KnowledgeNodeModel[];
  links: Array<{ source: string; target: string; relationType: string }>;
}
