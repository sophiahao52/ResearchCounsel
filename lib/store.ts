import { create } from "zustand";
import type { CritiqueResult, DiscoveryIdea, IdeaNode } from "@/lib/types/innovation";

export type StoredIdea = IdeaNode & { position: { x: number; y: number } };
type Operation = "discover" | "expand" | "merge" | "critique" | "improve";
type SwarmState = {
  mode: "empty" | "discover" | "canvas";
  ideas: Record<string, StoredIdea>;
  discovery: DiscoveryIdea[];
  selectedIds: string[];
  critiques: Record<string, CritiqueResult>;
  expandedIds: string[];
  loading: Partial<Record<Operation, boolean>>;
  error?: string;
  leftOpen: boolean;
  rightOpen: boolean;
  set: (patch: Partial<SwarmState>) => void;
  addIdeas: (ideas: StoredIdea[]) => void;
  updatePosition: (id: string, position: { x: number; y: number }) => void;
  reset: () => void;
};
const initial = { mode: "empty" as const, ideas: {}, discovery: [], selectedIds: [], critiques: {}, expandedIds: [], loading: {}, error: undefined };
export const useSwarm = create<SwarmState>((set) => ({
  ...initial, leftOpen: true, rightOpen: true,
  set: (patch) => set(patch),
  addIdeas: (next) => set((state) => ({ ideas: { ...state.ideas, ...Object.fromEntries(next.map((idea) => [idea.id, idea])) } })),
  updatePosition: (id, position) => set((state) => ({ ideas: { ...state.ideas, [id]: { ...state.ideas[id], position } } })),
  reset: () => set({ ...initial }),
}));
