import { create } from 'zustand'
import type { ReasoningGraph, PerspectiveNode, NodeStatus } from '../types'
import type { EngineStore } from '../engine/perspectiveEngine'
import * as engine from '../engine/perspectiveEngine'

// ─── Store shape ─────────────────────────────────────────────
interface ExplorationStore {
  // ─── Reasoning Graph ─────────────────────────────────────
  graph: ReasoningGraph | null
  setGraph: (graph: ReasoningGraph) => void
  updateNode: (nodeId: string, patch: Partial<PerspectiveNode>) => void

  // ─── Session ─────────────────────────────────────────────
  userQuestion: string
  setUserQuestion: (q: string) => void

  // ─── LLM root state ──────────────────────────────────────
  rootStatus: NodeStatus
  setRootStatus: (s: NodeStatus) => void

  // ─── Side Panel ──────────────────────────────────────────
  sidePanelOpen: boolean
  activePanelNodeId: string | null
  openSidePanel: (nodeId: string) => void
  closeSidePanel: () => void

  // ─── Breadcrumb ──────────────────────────────────────────
  breadcrumbPath: string[]           // ordered node IDs root → active
  setBreadcrumbPath: (path: string[]) => void

  // ─── Parallel branches ───────────────────────────────────
  expandedBranchIds: Set<string>     // all currently open L1 branch IDs
  activeFocusNodeId: string | null   // most recently interacted branch
  toggleBranch: (nodeId: string) => void
  setActiveFocus: (nodeId: string) => void

  // ─── Navigation (delegated to engine) ────────────────────
  navigateTo: (nodeId: string) => void
  returnToRoot: () => void

  // ─── Custom Branch ───────────────────────────────────────
  pendingCustomPrompt: string
  setPendingCustomPrompt: (text: string) => void
  // ─── Session History ─────────────────────────────────────
  sessions: ReasoningGraph[]           // snapshots of completed explorations
  chatHistory: Array<{ question: string; answer: string }>  // conversation thread
  archiveCurrentSession: () => void    // snapshot current graph before overwrite
  resetBranches: () => void            // clear expanded state for new session
}

// ─── Store implementation ─────────────────────────────────────
export const useExplorationStore = create<ExplorationStore>((set) => ({
  // ─── Graph ───────────────────────────────────────────────
  graph: null,

  setGraph: (graph) => set({ graph }),

  updateNode: (nodeId, patch) =>
    set((state) => {
      if (!state.graph) return {}
      const existing = state.graph.nodes[nodeId]
      if (!existing) {
        // Node not yet in graph (first write) — accept full patch as new node
        return {
          graph: {
            ...state.graph,
            nodes: {
              ...state.graph.nodes,
              [nodeId]: { ...patch } as PerspectiveNode,
            },
          },
        }
      }
      return {
        graph: {
          ...state.graph,
          nodes: {
            ...state.graph.nodes,
            [nodeId]: { ...existing, ...patch },
          },
        },
      }
    }),

  // ─── Session History ─────────────────────────────────────
  sessions: [],
  chatHistory: [],

  archiveCurrentSession: () =>
    set((state) => {
      if (!state.graph || state.graph.rootStatus !== 'ready') return {}
      return {
        sessions: [...state.sessions, { ...state.graph }],
        chatHistory: [
          ...state.chatHistory,
          { question: state.graph.rootQuestion, answer: state.graph.rootAnswer },
        ],
      }
    }),

  resetBranches: () =>
    set({ expandedBranchIds: new Set<string>(), breadcrumbPath: [] }),

  // ─── Session ─────────────────────────────────────────────
  userQuestion: '',
  setUserQuestion: (q) => set({ userQuestion: q }),

  // ─── Root status ─────────────────────────────────────────
  rootStatus: 'idle',
  setRootStatus: (s) =>
    set((state) => ({
      rootStatus: s,
      // Mirror into graph.rootStatus so components have one source of truth
      graph: state.graph ? { ...state.graph, rootStatus: s } : null,
    })),

  // ─── Side Panel ──────────────────────────────────────────
  sidePanelOpen: false,
  activePanelNodeId: null,

  openSidePanel: (nodeId) =>
    set({ sidePanelOpen: true, activePanelNodeId: nodeId }),

  closeSidePanel: () =>
    set({ sidePanelOpen: false, activePanelNodeId: null }),

  // ─── Breadcrumb ──────────────────────────────────────────
  breadcrumbPath: [],
  setBreadcrumbPath: (path) => set({ breadcrumbPath: path }),

  // ─── Parallel branches ───────────────────────────────────
  expandedBranchIds: new Set<string>(),
  activeFocusNodeId: null,

  toggleBranch: (nodeId) =>
    set((state) => {
      const next = new Set(state.expandedBranchIds)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return { expandedBranchIds: next }
    }),

  setActiveFocus: (nodeId) => set({ activeFocusNodeId: nodeId }),

  // ─── Navigation (delegates to engine) ────────────────────
  navigateTo: (nodeId) => engine.navigateToNode(nodeId),
  returnToRoot: () => engine.returnToRoot(),

  // ─── Custom Branch ───────────────────────────────────────
  pendingCustomPrompt: '',
  setPendingCustomPrompt: (text) => set({ pendingCustomPrompt: text }),
}))

// ─── Engine ↔ Store bridge ────────────────────────────────────
// Builds the EngineStore adapter and wires the engine once.
// Call initEngine() once at app boot (in App.tsx or main.tsx).
export function initEngine(): void {
  const adapter: EngineStore = {
    getGraph: () => useExplorationStore.getState().graph,
    setGraph: (g) => useExplorationStore.getState().setGraph(g),
    updateNode: (id, patch) => useExplorationStore.getState().updateNode(id, patch),
    setRootStatus: (s) => useExplorationStore.getState().setRootStatus(s),
    toggleBranch: (nodeId) => useExplorationStore.getState().toggleBranch(nodeId),
    openSidePanel: (nodeId) => useExplorationStore.getState().openSidePanel(nodeId),
    closeSidePanel: () => useExplorationStore.getState().closeSidePanel(),
    setBreadcrumbPath: (path) => useExplorationStore.getState().setBreadcrumbPath(path),
    setActiveFocus: (nodeId) => useExplorationStore.getState().setActiveFocus(nodeId),
    getExpandedBranchIds: () => useExplorationStore.getState().expandedBranchIds,
    archiveCurrentSession: () => useExplorationStore.getState().archiveCurrentSession(),
    resetBranches: () => useExplorationStore.getState().resetBranches(),
    getChatHistory: () => useExplorationStore.getState().chatHistory,
  }
  engine.init(adapter)
}
