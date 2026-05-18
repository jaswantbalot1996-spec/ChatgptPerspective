import type { ReasoningGraph, PromptChip } from '../../types'

// ─── Generic fallback answer ──────────────────────────────────
// Shown when the LLM fails to generate a primary answer.
// Content is intentionally neutral — it works for any topic.
export const FALLBACK_ANSWER =
  'This is a nuanced question that depends on a range of factors including your ' +
  'specific context, goals, and the assumptions embedded in how the question is framed. ' +
  'Consider exploring the perspectives below to surface what may be missing from a ' +
  'straightforward answer.'

// ─── Generic fallback prompt chips ───────────────────────────
// Shown when the LLM fails to generate perspective prompts.
// These are universally applicable to any topic or question.
export const FALLBACK_PROMPT_CHIPS: PromptChip[] = [
  {
    id: 'fallback-chip-1',
    label: 'What context might be missing here?',
    heatScore: 0.85,
  },
  {
    id: 'fallback-chip-2',
    label: 'What assumptions could this response depend on?',
    heatScore: 0.78,
  },
  {
    id: 'fallback-chip-3',
    label: 'What risks or trade-offs should be explored?',
    heatScore: 0.72,
  },
  {
    id: 'fallback-chip-4',
    label: 'What would change under a different perspective?',
    heatScore: 0.65,
  },
  {
    id: 'fallback-chip-5',
    label: 'Who else is affected by this decision?',
    heatScore: 0.60,
  },
]

// ─── Fallback branch content ──────────────────────────────────
// Used when expandPerspectiveBranch() fails for a given chip.
export const FALLBACK_BRANCH_CONTENT = {
  title: 'Unexplored Perspective',
  content:
    'This perspective could not be fully expanded at this time. Consider what assumptions, ' +
    'risks, or stakeholder impacts might be embedded in the original framing of this question.',
  risks: [
    'Relying on a single framing of the problem',
    'Overlooking perspectives that contradict the primary answer',
  ],
  assumptions: [
    'The original question captures the full scope of what matters',
    'The AI response accounts for all relevant context',
  ],
  implications: [
    'Decisions made without exploring alternatives may carry hidden risks',
    'Revisiting this branch with more context could reveal new insights',
  ],
  hiddenTradeoffs: [
    'Speed of decision-making vs. depth of exploration',
    'Confidence in the answer vs. awareness of its limits',
  ],
}

// ─── Fallback ReasoningGraph ──────────────────────────────────
// Constructed dynamically from the user's actual question.
// Used as last resort when both LLM and partial fallbacks fail.
export function buildFallbackGraph(userQuestion: string): ReasoningGraph {
  return {
    rootQuestion: userQuestion,
    rootAnswer: FALLBACK_ANSWER,
    rootStatus: 'ready',
    rootPrompts: FALLBACK_PROMPT_CHIPS,
    nodes: {},
  }
}
