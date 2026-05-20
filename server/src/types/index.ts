// ─── Core Node ───────────────────────────────────────────────
export type NodeStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface PerspectiveNode {
  id: string
  parentId: string | null
  depth: number
  question: string
  title: string
  content: string
  risks: string[]
  assumptions: string[]
  implications: string[]
  hiddenTradeoffs: string[]
  childPrompts: PromptChip[]
  isExpanded: boolean
  isCustom: boolean
  status: NodeStatus
  createdAt: number
}

// ─── Prompt Chip ─────────────────────────────────────────────
export interface PromptChip {
  id: string
  label: string
  heatScore: number
}

// ─── Reasoning Graph ─────────────────────────────────────────
export interface ReasoningGraph {
  rootQuestion: string
  rootAnswer: string
  rootStatus: NodeStatus
  rootPrompts: PromptChip[]
  nodes: Record<string, PerspectiveNode>
}

// ─── LLM Context passed to service functions ─────────────────
export interface LLMContext {
  userPrompt: string
  primaryAnswer: string
  branchPath: string[]
  currentQuestion: string
  depth: number
}

// ─── API request/response shapes ─────────────────────────────
export interface ExploreRequest {
  userPrompt: string
  history: Array<{ question: string; answer: string }>
}

export interface ExploreResponse {
  answer: string
  risks: string[]
  assumptions: string[]
  implications: string[]
  hiddenTradeoffs: string[]
  prompts: PromptChip[]
}

export interface ExpandRequest {
  ctx: LLMContext
}

export interface ExpandResponse {
  question: string
  title: string
  content: string
  risks: string[]
  assumptions: string[]
  implications: string[]
  hiddenTradeoffs: string[]
  childPrompts: PromptChip[]
}

export interface ErrorResponse {
  error: string
}
