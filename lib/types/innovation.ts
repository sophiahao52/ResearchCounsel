export type IdeaKind = "root" | "variation" | "merged" | "improved";

export type IdeaNode = {
  id: string;
  title: string;
  description: string;
  industry: string;
  generation: number;
  parentIds: string[];
  kind: IdeaKind;
  score?: number;
  createdAt: string;
  changes?: string;
};

export type DiscoveryIdea = Omit<IdeaNode, "id" | "generation" | "parentIds" | "kind" | "createdAt"> & {
  applications: string[];
  novelty: number;
};

export type AgentId = "technical" | "market" | "strategy" | "future";
export type AgentEvaluation = {
  agentId: AgentId;
  agentName: string;
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};
export type AgentConflict = {
  id: string;
  agentIds: AgentId[];
  issue: string;
  perspectives: { agentId: AgentId; position: string }[];
  resolution?: string;
};
export type CritiqueResult = {
  ideaId: string;
  evaluations: AgentEvaluation[];
  conflicts: AgentConflict[];
  overallSummary: string;
};
