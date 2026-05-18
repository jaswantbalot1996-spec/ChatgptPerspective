import { GoogleGenerativeAI } from '@google/generative-ai'
import type { LLMContext, PromptChip, PerspectiveNode } from '../types'
import {
  PRIMARY_ANSWER_SYSTEM_PROMPT,
  PERSPECTIVE_SYSTEM_PROMPT,
  BRANCH_EXPANSION_PROMPT,
  RECURSIVE_PROMPTS_SYSTEM_PROMPT,
  ROOT_EXPLORATION_PROMPT,
  BRANCH_WITH_PROMPTS_PROMPT,
} from '../prompts/systemPrompts'

// ─── Result discriminated union ───────────────────────────────
export type LLMResult<T> = T | { error: string }

export function isLLMError<T>(result: LLMResult<T>): result is { error: string } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof (result as { error: unknown }).error === 'string'
  )
}

// ─── Partial node returned by expandPerspectiveBranch ─────────
export type BranchContent = Omit<
  PerspectiveNode,
  'id' | 'parentId' | 'depth' | 'childPrompts' | 'isExpanded' | 'isCustom' | 'status' | 'createdAt'
>

// ─── Gemini client (instantiated once per session) ────────────
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_LLM_API_KEY)

function getModel(jsonMode: boolean) {
  return genAI.getGenerativeModel({
    model: import.meta.env.VITE_LLM_MODEL,
    generationConfig: jsonMode
      ? { responseMimeType: 'application/json' }
      : { responseMimeType: 'text/plain' },
  })
}

// ─── Helper: build LLM context string ────────────────────────
function buildContextMessage(ctx: LLMContext): string {
  const pathSummary =
    ctx.branchPath.length > 0
      ? `\n\nExploration path so far:\n${ctx.branchPath.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}`
      : ''

  return (
    `Original question: ${ctx.userPrompt}\n\n` +
    `Primary AI answer:\n${ctx.primaryAnswer}` +
    pathSummary +
    `\n\nCurrent question to explore: ${ctx.currentQuestion}\n` +
    `Current depth: ${ctx.depth}`
  )
}

// ─── 1. generatePrimaryAnswer ─────────────────────────────────
/**
 * Generates the main answer to the user's question.
 * Called once when the user submits via PromptInputBar.
 */
export async function generatePrimaryAnswer(
  userPrompt: string,
): Promise<LLMResult<string>> {
  try {
    const model = getModel(false)
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      systemInstruction: PRIMARY_ANSWER_SYSTEM_PROMPT,
    })
    return result.response.text()
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to generate answer' }
  }
}

// ─── 2. generatePerspectivePrompts ────────────────────────────
/**
 * Generates 3–5 perspective exploration chips after the root answer.
 * Each chip has a heatScore (0–1) signalling exploration priority.
 */
export async function generatePerspectivePrompts(
  ctx: LLMContext,
): Promise<LLMResult<PromptChip[]>> {
  try {
    const model = getModel(true)
    const userMessage = buildContextMessage(ctx)

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: PERSPECTIVE_SYSTEM_PROMPT,
    })

    const parsed = JSON.parse(result.response.text()) as {
      prompts: { id: string; label: string; heatScore: number }[]
    }

    // Validate and clamp heatScore
    return parsed.prompts.map((p) => ({
      id: p.id || crypto.randomUUID(),
      label: p.label,
      heatScore: Math.min(1, Math.max(0, Number(p.heatScore) || 0.5)),
    }))
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to generate perspective prompts' }
  }
}

// ─── 3. expandPerspectiveBranch ───────────────────────────────
/**
 * Expands a chip into a full perspective node with structured sections.
 * Returns everything except the fields the engine fills in (id, depth, etc.).
 */
export async function expandPerspectiveBranch(
  ctx: LLMContext,
): Promise<LLMResult<BranchContent>> {
  try {
    const model = getModel(true)
    const userMessage = buildContextMessage(ctx)

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: BRANCH_EXPANSION_PROMPT,
    })

    const parsed = JSON.parse(result.response.text()) as {
      title: string
      content: string
      risks: string[]
      assumptions: string[]
      implications: string[]
      hiddenTradeoffs: string[]
    }

    return {
      question: ctx.currentQuestion,
      title: parsed.title,
      content: parsed.content,
      risks: parsed.risks ?? [],
      assumptions: parsed.assumptions ?? [],
      implications: parsed.implications ?? [],
      hiddenTradeoffs: parsed.hiddenTradeoffs ?? [],
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to expand branch' }
  }
}

// ─── 4. generateRecursivePrompts ─────────────────────────────
/**
 * Generates 3–5 follow-up chips scoped to the current branch context.
 * Depth guard is enforced by the engine BEFORE this is called.
 */
export async function generateRecursivePrompts(
  ctx: LLMContext,
): Promise<LLMResult<PromptChip[]>> {
  try {
    const model = getModel(true)
    const userMessage = buildContextMessage(ctx)

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: RECURSIVE_PROMPTS_SYSTEM_PROMPT,
    })

    const parsed = JSON.parse(result.response.text()) as {
      prompts: { id: string; label: string; heatScore: number }[]
    }

    return parsed.prompts.map((p) => ({
      id: p.id || crypto.randomUUID(),
      label: p.label,
      heatScore: Math.min(1, Math.max(0, Number(p.heatScore) || 0.5)),
    }))
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to generate recursive prompts',
    }
  }
}

// ─── 5. generateRootExploration (combined — 1 call) ──────────
/**
 * Replaces generatePrimaryAnswer + generatePerspectivePrompts.
 * Returns answer text AND perspective chips in a single API call.
 */
export type RootExplorationResult = { answer: string; prompts: PromptChip[] }

export async function generateRootExploration(
  userPrompt: string,
  history: Array<{ question: string; answer: string }> = [],
): Promise<LLMResult<RootExplorationResult>> {
  try {
    const model = getModel(true)

    // Build conversation context from prior Q&A pairs
    const historyContext =
      history.length > 0
        ? `Previous conversation:\n${history
            .map((h) => `User: ${h.question}\nAssistant: ${h.answer}`)
            .join('\n\n')}\n\n`
        : ''

    const userMessage = `${historyContext}Current question: ${userPrompt}`

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: ROOT_EXPLORATION_PROMPT,
    })

    const parsed = JSON.parse(result.response.text()) as {
      answer: string
      prompts: { id: string; label: string; heatScore: number }[]
    }

    return {
      answer: parsed.answer,
      prompts: parsed.prompts.map((p) => ({
        id: p.id || crypto.randomUUID(),
        label: p.label,
        heatScore: Math.min(1, Math.max(0, Number(p.heatScore) || 0.5)),
      })),
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to generate root exploration' }
  }
}

// ─── 6. expandBranchWithPrompts (combined — 1 call) ──────────
/**
 * Replaces expandPerspectiveBranch + generateRecursivePrompts.
 * Returns full branch content AND child chips in a single API call.
 */
export type BranchWithPromptsResult = BranchContent & { childPrompts: PromptChip[] }

export async function expandBranchWithPrompts(
  ctx: LLMContext,
): Promise<LLMResult<BranchWithPromptsResult>> {
  try {
    const model = getModel(true)
    const userMessage = buildContextMessage(ctx)

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: BRANCH_WITH_PROMPTS_PROMPT,
    })

    const parsed = JSON.parse(result.response.text()) as {
      title: string
      content: string
      risks: string[]
      assumptions: string[]
      implications: string[]
      hiddenTradeoffs: string[]
      prompts: { id: string; label: string; heatScore: number }[]
    }

    return {
      question: ctx.currentQuestion,
      title: parsed.title,
      content: parsed.content,
      risks: parsed.risks ?? [],
      assumptions: parsed.assumptions ?? [],
      implications: parsed.implications ?? [],
      hiddenTradeoffs: parsed.hiddenTradeoffs ?? [],
      childPrompts: (parsed.prompts ?? []).map((p) => ({
        id: p.id || crypto.randomUUID(),
        label: p.label,
        heatScore: Math.min(1, Math.max(0, Number(p.heatScore) || 0.5)),
      })),
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to expand branch with prompts' }
  }
}
