import type { LLMContext, PromptChip, PerspectiveNode } from '../types'

// --- API base URL ---------------------------------------------
// In dev: http://localhost:3001  (set VITE_API_BASE_URL in .env)
// In prod: your deployed backend URL (set VITE_API_BASE_URL in Vercel env vars)
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

// --- Result discriminated union -------------------------------
export type LLMResult<T> = T | { error: string }

export function isLLMError<T>(result: LLMResult<T>): result is { error: string } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof (result as { error: unknown }).error === 'string'
  )
}

// --- Partial node type ----------------------------------------
export type BranchContent = Omit<
  PerspectiveNode,
  'id' | 'parentId' | 'depth' | 'childPrompts' | 'isExpanded' | 'isCustom' | 'status' | 'createdAt'
>

// --- Combined result types ------------------------------------
export type RootExplorationResult = { answer: string; prompts: PromptChip[] }
export type BranchWithPromptsResult = BranchContent & { childPrompts: PromptChip[] }

// --- Helper: POST to backend ----------------------------------
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// --- 1. generateRootExploration -------------------------------
// Calls POST /api/explore ? { answer, prompts[] }
export async function generateRootExploration(
  userPrompt: string,
  history: Array<{ question: string; answer: string }> = [],
): Promise<LLMResult<RootExplorationResult>> {
  try {
    return await post<RootExplorationResult>('/api/explore', { userPrompt, history })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to generate exploration' }
  }
}

// --- 2. expandBranchWithPrompts -------------------------------
// Calls POST /api/expand ? { title, content, risks, ..., childPrompts[] }
export async function expandBranchWithPrompts(
  ctx: LLMContext,
): Promise<LLMResult<BranchWithPromptsResult>> {
  try {
    return await post<BranchWithPromptsResult>('/api/expand', { ctx })
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to expand branch' }
  }
}
