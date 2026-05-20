import { GoogleGenerativeAI } from '@google/generative-ai'
import type { LLMContext, PromptChip, ExploreResponse, ExpandResponse } from '../types/index.js'
import { ROOT_EXPLORATION_PROMPT, BRANCH_WITH_PROMPTS_PROMPT } from '../prompts/systemPrompts.js'
import { FALLBACK_ANSWER, FALLBACK_PROMPT_CHIPS, FALLBACK_BRANCH } from '../data/genericFallback.js'

// ─── Gemini client ────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.LLM_API_KEY ?? '')

function getModel(jsonMode: boolean) {
  return genAI.getGenerativeModel({
    model: process.env.LLM_MODEL ?? 'gemini-2.5-flash-lite',
    generationConfig: jsonMode
      ? { responseMimeType: 'application/json' }
      : { responseMimeType: 'text/plain' },
  })
}

// ─── Exponential backoff retry ────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      const isRetryable =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('too many') ||
        msg.includes('service unavailable') ||
        msg.includes('high demand')
      if (!isRetryable || attempt === maxRetries) throw err
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 500, 30_000)
      console.warn(`[LLM] ${msg.includes('503') ? '503' : '429'} — retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${maxRetries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

// ─── Helper: build branch context message ────────────────────
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

// ─── Chip normaliser ─────────────────────────────────────────
function normaliseChip(p: { id?: string; label: string; heatScore?: number }): PromptChip {
  return {
    id: p.id || crypto.randomUUID(),
    label: p.label,
    heatScore: Math.min(1, Math.max(0, Number(p.heatScore) || 0.5)),
  }
}

// ─── 1. explore — answer + chips in one call ──────────────────
export async function explore(
  userPrompt: string,
  history: Array<{ question: string; answer: string }>,
): Promise<ExploreResponse> {
  try {
    const model = getModel(true)

    const historyContext =
      history.length > 0
        ? `Previous conversation:\n${history
            .map((h) => `User: ${h.question}\nAssistant: ${h.answer}`)
            .join('\n\n')}\n\n`
        : ''

    const userMessage = `${historyContext}Current question: ${userPrompt}`

    const result = await withRetry(() =>
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: ROOT_EXPLORATION_PROMPT,
      })
    )

    const parsed = JSON.parse(result.response.text()) as {
      answer: string
      risks: string[]
      assumptions: string[]
      implications: string[]
      hiddenTradeoffs: string[]
      prompts: { id?: string; label: string; heatScore?: number }[]
    }

    return {
      answer: parsed.answer,
      risks: parsed.risks ?? [],
      assumptions: parsed.assumptions ?? [],
      implications: parsed.implications ?? [],
      hiddenTradeoffs: parsed.hiddenTradeoffs ?? [],
      prompts: parsed.prompts.map(normaliseChip),
    }
  } catch (err) {
    console.error('[LLM] explore failed:', err)
    return { answer: FALLBACK_ANSWER, risks: [], assumptions: [], implications: [], hiddenTradeoffs: [], prompts: FALLBACK_PROMPT_CHIPS }
  }
}

// ─── 2. expand — branch content + child chips in one call ─────
export async function expand(ctx: LLMContext): Promise<ExpandResponse> {
  try {
    const model = getModel(true)
    const userMessage = buildContextMessage(ctx)

    const result = await withRetry(() =>
      model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: BRANCH_WITH_PROMPTS_PROMPT,
      })
    )

    const parsed = JSON.parse(result.response.text()) as {
      title: string
      content: string
      risks: string[]
      assumptions: string[]
      implications: string[]
      hiddenTradeoffs: string[]
      prompts: { id?: string; label: string; heatScore?: number }[]
    }

    return {
      question: ctx.currentQuestion,
      title: parsed.title,
      content: parsed.content,
      risks: parsed.risks ?? [],
      assumptions: parsed.assumptions ?? [],
      implications: parsed.implications ?? [],
      hiddenTradeoffs: parsed.hiddenTradeoffs ?? [],
      childPrompts: (parsed.prompts ?? []).map(normaliseChip),
    }
  } catch (err) {
    console.error('[LLM] expand failed:', err)
    return { question: ctx.currentQuestion, ...FALLBACK_BRANCH }
  }
}
