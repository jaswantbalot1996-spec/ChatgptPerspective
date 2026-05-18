/**
 * Perspective Orchestration Engine
 *
 * Pure TypeScript module — no React, no JSX.
 * Owns all reasoning graph logic. Components and the Zustand store
 * call these functions; this engine decides what to fetch, how to
 * update the graph, and how to enforce depth limits.
 *
 * INVARIANTS enforced here:
 *  - graph.rootAnswer is write-once (set in startExploration only)
 *  - Max expand depth = 3; depth ≥ 3 is blocked before any LLM call
 *  - L1 branches are parallel: expanding one never collapses others
 *  - Intra-branch (depth 2–3): expanding a child collapses its siblings
 *  - Collapsed nodes are never deleted from the graph
 *  - Custom branches blocked at depth 3
 */

import type { PerspectiveNode, ReasoningGraph, PromptChip, LLMContext } from '../types'
import {
  generateRootExploration,
  expandBranchWithPrompts,
  isLLMError,
} from '../services/llmService'
import {
  FALLBACK_ANSWER,
  FALLBACK_PROMPT_CHIPS,
  FALLBACK_BRANCH_CONTENT,
  buildFallbackGraph,
} from '../data/fallback/genericFallback'

// ─── Store interface (structural) ────────────────────────────
// The engine imports a getter/setter pair so it stays decoupled from
// Zustand internals. Wire these up in explorationStore.ts.
export interface EngineStore {
  getGraph: () => ReasoningGraph | null
  setGraph: (g: ReasoningGraph) => void
  updateNode: (id: string, patch: Partial<PerspectiveNode>) => void
  setRootStatus: (s: PerspectiveNode['status']) => void
  toggleBranch: (nodeId: string) => void
  openSidePanel: (nodeId: string) => void
  closeSidePanel: () => void
  setBreadcrumbPath: (path: string[]) => void
  setActiveFocus: (nodeId: string) => void
  getExpandedBranchIds: () => Set<string>
  archiveCurrentSession: () => void
  resetBranches: () => void
  getChatHistory: () => Array<{ question: string; answer: string }>
}

// ─── Module-level store reference ────────────────────────────
// Set once during app boot via engine.init(store)
let _store: EngineStore | null = null

export function init(store: EngineStore): void {
  _store = store
}

function store(): EngineStore {
  if (!_store) throw new Error('PerspectiveEngine not initialised. Call engine.init(store) first.')
  return _store
}

// ─── Helpers ─────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID()
}

/** Walk parentId chain from a node up to the root, return ordered IDs. */
function buildBreadcrumb(nodeId: string, graph: ReasoningGraph): string[] {
  const path: string[] = []
  let current: string | null = nodeId
  while (current && graph.nodes[current]) {
    path.unshift(current)
    current = graph.nodes[current].parentId
  }
  return path
}

/** Find all direct children (by parentId) of a given node. */
function childrenOf(parentId: string, graph: ReasoningGraph): PerspectiveNode[] {
  return Object.values(graph.nodes).filter((n) => n.parentId === parentId)
}

/** Build LLMContext for a node. */
function buildCtx(
  graph: ReasoningGraph,
  question: string,
  depth: number,
  parentNodeId: string | null,
): LLMContext {
  const branchPath: string[] = []
  if (parentNodeId) {
    const crumbs = buildBreadcrumb(parentNodeId, graph)
    crumbs.forEach((id) => {
      const n = graph.nodes[id]
      if (n) branchPath.push(n.question)
    })
  }
  return {
    userPrompt: graph.rootQuestion,
    primaryAnswer: graph.rootAnswer,
    branchPath,
    currentQuestion: question,
    depth,
  }
}

// ─── 1. startExploration ─────────────────────────────────────

/** Guard: prevents duplicate in-flight root exploration calls */
let _explorationInFlight = false

/**
 * Initialises a brand-new exploration session for a user question.
 * Writes the graph once; rootAnswer is never overwritten after this.
 */
export async function startExploration(userPrompt: string): Promise<void> {
  if (_explorationInFlight) return
  _explorationInFlight = true

  const s = store()

  // Archive previous session and reset branch state before starting fresh
  s.archiveCurrentSession()
  s.resetBranches()

  // Build conversation history for LLM context
  const history = s.getChatHistory()

  // Set root loading state
  s.setRootStatus('loading')

  // Single combined call: answer + perspective chips together
  const result = await generateRootExploration(userPrompt, history)
  if (isLLMError(result)) {
    console.error('[Engine] generateRootExploration failed:', result.error)
  }

  const rootAnswer = isLLMError(result) ? FALLBACK_ANSWER : result.answer
  const rootPrompts: PromptChip[] = isLLMError(result) ? FALLBACK_PROMPT_CHIPS : result.prompts

  const readyGraph: ReasoningGraph = {
    rootQuestion: userPrompt,
    rootAnswer,
    rootStatus: 'ready',
    rootPrompts,
    nodes: {},
  }
  s.setGraph(readyGraph)
  s.setRootStatus('ready')
  _explorationInFlight = false
}

// ─── 2. expandBranch ─────────────────────────────────────────

/**
 * Expands a chip (identified by chipId which == node id to create)
 * into a full PerspectiveNode. Handles both L1 (parentNodeId=null)
 * and deeper levels.
 *
 * Parallel-branch invariant: at L1 we NEVER touch sibling branches.
 * Intra-branch invariant: at depth ≥2 we collapse siblings within
 * the same parent before expanding the new child.
 */
export async function expandBranch(
  chipId: string,
  parentNodeId: string | null,
): Promise<void> {
  const s = store()
  const graph = s.getGraph()
  if (!graph) return

  // ── Determine depth ──────────────────────────────────────
  const depth = parentNodeId ? (graph.nodes[parentNodeId]?.depth ?? 0) + 1 : 1

  // ── Depth guard ──────────────────────────────────────────
  if (depth >= 3) {
    // Mark as terminal — no LLM call, no expansion
    if (!graph.nodes[chipId]) {
      // Node doesn't exist yet — create a terminal stub
      const stub: PerspectiveNode = {
        id: chipId,
        parentId: parentNodeId,
        depth,
        question: chipId, // chip label is used as question when node not found
        title: 'Max depth reached',
        content: 'This perspective has reached the maximum exploration depth.',
        risks: [],
        assumptions: [],
        implications: [],
        hiddenTradeoffs: [],
        childPrompts: [],
        isExpanded: false,
        isCustom: false,
        status: 'idle',
        createdAt: Date.now(),
      }
      s.setGraph({ ...graph, nodes: { ...graph.nodes, [chipId]: stub } })
    }
    return
  }

  // ── If already expanded and cached, just re-toggle ───────
  const existing = graph.nodes[chipId]
  if (existing && existing.status === 'ready') {
    s.toggleBranch(chipId)
    if (depth === 1) {
      s.openSidePanel(chipId)
      s.setActiveFocus(chipId)
    }
    s.setBreadcrumbPath(buildBreadcrumb(chipId, graph))
    return
  }

  // ── Intra-branch collapse (depth 2–3 only) ───────────────
  // Collapse siblings within the same parent, but ONLY for depth ≥ 2.
  // At depth 1 (L1) we never touch siblings.
  if (depth >= 2 && parentNodeId) {
    const siblings = childrenOf(parentNodeId, graph)
    siblings.forEach((sibling) => {
      if (sibling.id !== chipId && sibling.isExpanded) {
        s.updateNode(sibling.id, { isExpanded: false })
      }
    })
  }

  // ── Find the chip label to use as question ────────────────
  // The chip might come from rootPrompts or a parent node's childPrompts
  let question = chipId // fallback
  const rootChip = graph.rootPrompts.find((c) => c.id === chipId)
  if (rootChip) {
    question = rootChip.label
  } else if (parentNodeId && graph.nodes[parentNodeId]) {
    const parentChip = graph.nodes[parentNodeId].childPrompts.find((c) => c.id === chipId)
    if (parentChip) question = parentChip.label
  }

  // ── Create loading node ───────────────────────────────────
  const loadingNode: PerspectiveNode = {
    id: chipId,
    parentId: parentNodeId,
    depth,
    question,
    title: '',
    content: '',
    risks: [],
    assumptions: [],
    implications: [],
    hiddenTradeoffs: [],
    childPrompts: [],
    isExpanded: true,
    isCustom: false,
    status: 'loading',
    createdAt: Date.now(),
  }
  s.setGraph({ ...graph, nodes: { ...graph.nodes, [chipId]: loadingNode } })

  if (depth === 1) {
    s.openSidePanel(chipId)
    s.setActiveFocus(chipId)
  }

  // ── Refresh graph ref after setGraph ─────────────────────
  const freshGraph = s.getGraph() ?? graph

  // ── Single combined LLM call: branch content + child chips ─
  const ctx = buildCtx(freshGraph, question, depth, parentNodeId)
  const branchResult = await expandBranchWithPrompts(ctx)
  if (isLLMError(branchResult)) {
    console.error('[Engine] expandBranchWithPrompts failed:', branchResult.error)
  }

  const branchContent = isLLMError(branchResult) ? FALLBACK_BRANCH_CONTENT : branchResult
  const childPrompts: PromptChip[] = isLLMError(branchResult) ? [] : branchResult.childPrompts

  // ── Update node to ready ──────────────────────────────────
  const readyNode: Partial<PerspectiveNode> = {
    ...branchContent,
    childPrompts,
    isExpanded: true,
    status: 'ready',
  }
  s.updateNode(chipId, readyNode)
  s.toggleBranch(chipId)
  s.setBreadcrumbPath(buildBreadcrumb(chipId, s.getGraph() ?? freshGraph))
}

// ─── 3. collapseBranch ───────────────────────────────────────

/**
 * Collapses a branch. Content is preserved in the graph.
 * Never deletes the node.
 */
export function collapseBranch(nodeId: string): void {
  const s = store()
  s.updateNode(nodeId, { isExpanded: false })
  s.toggleBranch(nodeId) // removes from expandedBranchIds

  // If no branches remain open, close side panel
  if (s.getExpandedBranchIds().size === 0) {
    s.closeSidePanel()
  }
}

// ─── 4. navigateToNode ───────────────────────────────────────

/**
 * Jumps focus to a previously explored node.
 * Updates breadcrumb trail and activeFocusNodeId.
 */
export function navigateToNode(nodeId: string): void {
  const s = store()
  const graph = s.getGraph()
  if (!graph || !graph.nodes[nodeId]) return

  s.setBreadcrumbPath(buildBreadcrumb(nodeId, graph))
  s.setActiveFocus(nodeId)

  const node = graph.nodes[nodeId]
  // Ensure L1 ancestor is in expandedBranchIds so it renders
  if (node.depth === 1) {
    s.openSidePanel(nodeId)
    if (!node.isExpanded) {
      s.updateNode(nodeId, { isExpanded: true })
      s.toggleBranch(nodeId)
    }
  }
}

// ─── 5. createCustomBranch ───────────────────────────────────

/**
 * Accepts user-typed text and creates a custom PerspectiveNode.
 * Custom nodes are visually differentiated (dashed border).
 * Blocked at depth ≥ 3.
 */
export async function createCustomBranch(
  userText: string,
  parentNodeId: string | null,
): Promise<void> {
  const s = store()
  const graph = s.getGraph()
  if (!graph) return

  const depth = parentNodeId ? (graph.nodes[parentNodeId]?.depth ?? 0) + 1 : 1

  // Custom branch depth guard
  if (depth >= 3) return

  const nodeId = uuid()

  // Intra-branch collapse for depth ≥ 2
  if (depth >= 2 && parentNodeId) {
    childrenOf(parentNodeId, graph).forEach((sibling) => {
      if (sibling.isExpanded) s.updateNode(sibling.id, { isExpanded: false })
    })
  }

  // Create loading node
  const loadingNode: PerspectiveNode = {
    id: nodeId,
    parentId: parentNodeId,
    depth,
    question: userText,
    title: '',
    content: '',
    risks: [],
    assumptions: [],
    implications: [],
    hiddenTradeoffs: [],
    childPrompts: [],
    isExpanded: true,
    isCustom: true,
    status: 'loading',
    createdAt: Date.now(),
  }
  s.setGraph({ ...graph, nodes: { ...graph.nodes, [nodeId]: loadingNode } })

  if (depth === 1) {
    s.openSidePanel(nodeId)
    s.setActiveFocus(nodeId)
  }

  const freshGraph = s.getGraph() ?? graph
  const ctx = buildCtx(freshGraph, userText, depth, parentNodeId)

  // Single combined call: branch content + child chips
  const branchResult = await expandBranchWithPrompts(ctx)
  if (isLLMError(branchResult)) {
    console.error('[Engine] createCustomBranch expandBranchWithPrompts failed:', branchResult.error)
  }
  const branchContent = isLLMError(branchResult) ? FALLBACK_BRANCH_CONTENT : branchResult
  const childPrompts: PromptChip[] = isLLMError(branchResult) ? [] : branchResult.childPrompts

  s.updateNode(nodeId, {
    ...branchContent,
    childPrompts,
    isExpanded: true,
    status: 'ready',
  })
  s.toggleBranch(nodeId)
  s.setBreadcrumbPath(buildBreadcrumb(nodeId, s.getGraph() ?? freshGraph))
}

// ─── 6. returnToRoot ─────────────────────────────────────────

/**
 * Collapses all branches and closes the side panel.
 * Graph is fully preserved — user can re-expand any branch.
 */
export function returnToRoot(): void {
  const s = store()
  const graph = s.getGraph()
  if (!graph) return

  // Collapse every node
  Object.keys(graph.nodes).forEach((id) => {
    s.updateNode(id, { isExpanded: false })
  })

  // Clear expandedBranchIds — toggle out every currently-tracked ID so the
  // next exploration's collapseBranch auto-close check works correctly.
  const expanded = s.getExpandedBranchIds()
  expanded.forEach((id) => s.toggleBranch(id))

  s.closeSidePanel()
  s.setBreadcrumbPath([])
}

// ─── 7. getBreadcrumbPath ────────────────────────────────────

/**
 * Returns ordered PerspectiveNode[] from root to the given node.
 * Used by ExplorationBreadcrumbs to render the trail.
 */
export function getBreadcrumbPath(nodeId: string): PerspectiveNode[] {
  const graph = store().getGraph()
  if (!graph) return []
  return buildBreadcrumb(nodeId, graph)
    .map((id) => graph.nodes[id])
    .filter(Boolean)
}

// ─── Fallback graph builder (re-exported for store) ──────────
export { buildFallbackGraph }
