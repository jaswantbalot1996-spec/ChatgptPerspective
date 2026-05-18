// ─── Error state definitions ──────────────────────────────────
// User-facing messages for each failure mode.
// The engine selects the appropriate message based on the error type.

export type ErrorKind =
  | 'missing_key'    // VITE_LLM_API_KEY is empty or placeholder
  | 'auth_error'     // 401 / 403 from Gemini — key invalid or revoked
  | 'rate_limit'     // 429 from Gemini — quota exceeded
  | 'network_error'  // fetch failed, no internet
  | 'parse_error'    // LLM returned malformed JSON
  | 'unknown'        // catch-all

export interface ErrorState {
  kind: ErrorKind
  heading: string
  detail: string
  recoverable: boolean   // if true, show retry button; if false, show setup instructions
  actionLabel?: string   // label for the CTA button
}

export const ERROR_STATES: Record<ErrorKind, ErrorState> = {
  missing_key: {
    kind: 'missing_key',
    heading: 'API key not configured',
    detail:
      'Add your Google AI Studio key to the .env file as VITE_LLM_API_KEY, ' +
      'then restart the dev server. Your key is never stored or sent anywhere except directly to Google.',
    recoverable: false,
    actionLabel: 'Get a key at aistudio.google.com',
  },

  auth_error: {
    kind: 'auth_error',
    heading: 'API key invalid or revoked',
    detail:
      'The provided API key was rejected by Google. It may have been rotated, revoked, or typed incorrectly. ' +
      'Update VITE_LLM_API_KEY in your .env file and restart the server.',
    recoverable: false,
    actionLabel: 'Check your API key',
  },

  rate_limit: {
    kind: 'rate_limit',
    heading: 'Rate limit reached',
    detail:
      'The Gemini API quota has been exceeded for this key. ' +
      'Perspective exploration is still available using the fallback layer. ' +
      'Try again in a few minutes.',
    recoverable: true,
    actionLabel: 'Retry',
  },

  network_error: {
    kind: 'network_error',
    heading: 'Could not reach the AI',
    detail:
      'A network error occurred while contacting the Gemini API. ' +
      'Check your internet connection. Fallback perspectives are shown in the meantime.',
    recoverable: true,
    actionLabel: 'Retry',
  },

  parse_error: {
    kind: 'parse_error',
    heading: 'Unexpected response format',
    detail:
      'The AI returned a response in an unexpected format. ' +
      'Generic fallback perspectives are shown instead. This is usually transient.',
    recoverable: true,
    actionLabel: 'Retry',
  },

  unknown: {
    kind: 'unknown',
    heading: 'Something went wrong',
    detail:
      'An unexpected error occurred. Fallback perspectives are shown. ' +
      'If this persists, check the browser console for details.',
    recoverable: true,
    actionLabel: 'Retry',
  },
}

// ─── Helper: classify an error into an ErrorKind ─────────────
export function classifyError(err: unknown): ErrorKind {
  if (!import.meta.env.VITE_LLM_API_KEY || import.meta.env.VITE_LLM_API_KEY === 'your_google_api_key_here') {
    return 'missing_key'
  }

  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()

  if (message.includes('api_key') || message.includes('401') || message.includes('403') || message.includes('permission')) {
    return 'auth_error'
  }
  if (message.includes('429') || message.includes('quota') || message.includes('rate')) {
    return 'rate_limit'
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
    return 'network_error'
  }
  if (message.includes('json') || message.includes('parse') || message.includes('unexpected token')) {
    return 'parse_error'
  }

  return 'unknown'
}

// ─── Helper: get ErrorState for a caught error ────────────────
export function getErrorState(err: unknown): ErrorState {
  return ERROR_STATES[classifyError(err)]
}
