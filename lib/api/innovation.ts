import * as mock from "./mock-innovation";
import type { CritiqueResult, DiscoveryIdea, IdeaNode } from "@/lib/types/innovation";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return (await response.json()) as T;
  } finally { clearTimeout(timeout); }
}

export const innovationApi = {
  discoverIdeas: (prompt: string): Promise<DiscoveryIdea[]> => useMock ? mock.discoverIdeas(prompt) : post("/api/discover", { prompt }),
  expandIdea: (idea: IdeaNode, count = 10): Promise<IdeaNode[]> => useMock ? mock.expandIdea(idea, count) : post("/api/expand", { idea, count }),
  mergeIdeas: (ideas: IdeaNode[]): Promise<IdeaNode> => useMock ? mock.mergeIdeas(ideas) : post("/api/merge", { ideas }),
  critiqueIdea: (idea: IdeaNode): Promise<CritiqueResult> => useMock ? mock.critiqueIdea(idea) : post("/api/critique", { idea }),
  improveIdea: (idea: IdeaNode, critique?: CritiqueResult): Promise<IdeaNode> => useMock ? mock.improveIdea(idea) : post("/api/improve", { idea, critique }),
};
