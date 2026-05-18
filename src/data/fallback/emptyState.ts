import type { PromptChip } from '../../types'

// ─── Empty state ──────────────────────────────────────────────
// Shown in the chat window before the user has submitted any question.
// These are example starter chips to guide first-time users.

export const EMPTY_STATE_HEADLINE =
  'Ask any question to begin exploring perspectives'

export const EMPTY_STATE_SUBTEXT =
  'The AI will answer your question, then surface what may be missing — ' +
  'assumptions, risks, trade-offs, and alternative viewpoints you can explore recursively.'

// Example starter chips displayed in the empty state to inspire the user.
// These are UI hints only — they do NOT pre-populate the reasoning graph.
export interface StarterPrompt {
  id: string
  label: string
  exampleQuestion: string
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'starter-1',
    label: 'Career decision',
    exampleQuestion: 'Should I accept this job offer?',
  },
  {
    id: 'starter-2',
    label: 'Product strategy',
    exampleQuestion: 'Should we build this feature or focus on retention?',
  },
  {
    id: 'starter-3',
    label: 'Technical choice',
    exampleQuestion: 'Should we migrate our monolith to microservices?',
  },
  {
    id: 'starter-4',
    label: 'Life planning',
    exampleQuestion: 'Should I move to a new city for this opportunity?',
  },
]

// Generic pre-exploration chips rendered before any LLM response.
// These hint at the kind of perspectives the layer will generate.
// Replaced by real LLM chips once the user submits a question.
export const PREVIEW_CHIPS: PromptChip[] = [
  { id: 'preview-1', label: 'What assumptions exist here?', heatScore: 0.7 },
  { id: 'preview-2', label: 'What risks are being overlooked?', heatScore: 0.6 },
  { id: 'preview-3', label: 'Who else is affected by this?', heatScore: 0.5 },
]
