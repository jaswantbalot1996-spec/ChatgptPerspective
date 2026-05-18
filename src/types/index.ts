// ─── Core Node ───────────────────────────────────────────────
export type NodeStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface PerspectiveNode {
  id: string
  parentId: string | null
  depth: number                   // 0 = root, max 3
  question: string                // the prompt that triggered this node
  title: string                   // display title for the panel header
  content: string                 // AI-generated explanation
  risks: string[]
  assumptions: string[]
  implications: string[]
  hiddenTradeoffs: string[]
  childPrompts: PromptChip[]      // 3–5 follow-up chips
  isExpanded: boolean
  isCustom: boolean               // true if user typed this branch manually
  status: NodeStatus              // LLM loading state for this node
  createdAt: number               // timestamp for branch ordering
}

// ─── Prompt Chip ─────────────────────────────────────────────
export interface PromptChip {
  id: string
  label: string
  heatScore: number               // 0–1, drives heat indicator opacity
}

// ─── Reasoning Graph ─────────────────────────────────────────
export interface ReasoningGraph {
  rootQuestion: string
  rootAnswer: string
  rootStatus: NodeStatus
  rootPrompts: PromptChip[]       // level-1 chips below the main answer
  nodes: Record<string, PerspectiveNode>
}

// ─── LLM Context passed to service functions ─────────────────
export interface LLMContext {
  userPrompt: string
  primaryAnswer: string
  branchPath: string[]            // ordered node IDs from root to current
  currentQuestion: string
  depth: number
}

// ─── Scenario ────────────────────────────────────────────────
export type ScenarioKey = 'startup' | 'resume' | 'architecture'

export interface ScenarioSeed {
  key: ScenarioKey
  question: string
  label: string
}
