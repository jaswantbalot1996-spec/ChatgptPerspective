# Perspective Expansion Layer

> AI interaction transformed from linear conversation into recursive cognitive exploration.

A ChatGPT-style interface that goes beyond answers — it surfaces hidden assumptions, overlooked trade-offs, stakeholder impacts, and alternative interpretations through an interactive branching exploration system powered by Google Gemini.

---

## What It Does

When you ask a question, you don't just get an answer. You get:

- **An AI answer** — direct response to your question
- **Perspective chips** — 3–5 context-aware follow-up prompts that reveal what the answer may be missing
- **A side exploration panel** — click any chip to expand it into a full perspective node with risks, assumptions, implications, and hidden trade-offs
- **Recursive depth** — each perspective node generates its own follow-up chips, up to 3 levels deep
- **Parallel branches** — explore multiple perspectives simultaneously, each in its own collapsible branch
- **Custom branches** — type your own angle to explore
- **Conversation memory** — ask follow-up questions in the main chat; the AI retains full prior context
- **Exploration history** — previous questions and their explored perspectives are preserved in the side panel

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vite 6 + React 18 + TypeScript |
| State | Zustand 5 |
| LLM | Google Gemini (`gemini-2.0-flash-lite`) via `@google/generative-ai` |
| Animation | Framer Motion 11 |
| Styling | TailwindCSS 3 |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatShell.tsx               — root layout, chat thread rendering
│   │   ├── AIAnswerCard.tsx            — current answer + perspective chips
│   │   ├── PerspectivePromptChips.tsx  — chip bar with heat indicators
│   │   └── PromptInputBar.tsx          — question submission
│   ├── exploration/
│   │   ├── ExplorationSidePanel.tsx    — slide-in panel host
│   │   ├── ExplorationHistory.tsx      — past session accordions
│   │   ├── CollapsibleReasoningTree.tsx — parallel branch manager
│   │   ├── RecursiveReasoningNode.tsx  — self-referential branch renderer
│   │   ├── PerspectiveInsightCard.tsx  — single node content card
│   │   └── ExplorationBreadcrumbs.tsx  — path trail
│   ├── navigation/
│   │   ├── BranchNavigator.tsx         — MiniMap toggle
│   │   └── ReturnToRootButton.tsx
│   └── shared/
│       ├── MiniMap.tsx                 — SVG branch overview
│       ├── ShimmerSkeleton.tsx         — loading placeholder
│       └── ThinkingIndicator.tsx       — 3-dot pulse animation
├── engine/
│   └── perspectiveEngine.ts           — orchestration: depth guards, branch logic
├── services/
│   └── llmService.ts                  — all Gemini API calls
├── store/
│   └── explorationStore.ts            — Zustand store + engine adapter
├── prompts/
│   └── systemPrompts.ts               — prompt engineering constants
├── data/
│   └── fallback/
│       └── genericFallback.ts         — offline fallback content
├── types/
│   └── index.ts                       — shared TypeScript types
└── animations/
    └── variants.ts                    — Framer Motion animation variants
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd ChatgptPerspective
npm install
```

### 2. Set up environment

Create a `.env` file at the project root:

```
VITE_LLM_API_KEY=your_google_api_key_here
VITE_LLM_MODEL=gemini-2.0-flash-lite
```

Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey). Create a **new project** for a fresh quota (free tier: 1,500 requests/day).

> **Never commit `.env`** — it is already in `.gitignore`.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## How to Use

1. **Type any question** in the input bar and press Enter or click Send
2. The AI answers, then perspective chips appear below the answer
3. **Click a chip** to open the side panel with a full perspective breakdown
4. Inside the side panel, **click child chips** to go deeper (up to 3 levels)
5. **Click multiple chips** from the main answer to explore parallel branches simultaneously
6. Use the **`+` button** after the chips to type a custom angle to explore
7. **Ask a follow-up** in the main chat — the AI retains the full conversation context
8. Previous questions and their explorations are preserved in **"Previous explorations"** at the bottom of the side panel

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| 1 API call per user action | Combines answer + chips (or branch + child chips) in a single JSON response to stay within free-tier rate limits |
| `gemini-2.0-flash-lite` | Lowest latency + highest free-tier quota of available Gemini models |
| Framing as "exploratory perspectives" | System prompts explicitly avoid "correct/wrong" language; outputs are always presented as possibilities, never verdicts |
| Max depth = 3 | Prevents runaway recursion; terminal nodes render as collapsed summaries |
| L1 branches are always parallel | Expanding one branch never auto-collapses another; all parallel explorations remain visible |
| Conversation history in LLM context | Full prior Q&A is prepended to each new question so follow-ups resolve correctly |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_LLM_API_KEY` | Google Gemini API key (required) |
| `VITE_LLM_MODEL` | Gemini model name (default: `gemini-2.0-flash-lite`) |

> `.env` changes require a dev server restart (`Ctrl+C` → `npm run dev`).

---

## Build for Production

```bash
npm run build
npm run preview
```

---

## Rate Limits (Free Tier)

Google AI Studio free tier allows **1,500 requests/day and 15 requests/minute** per project. If you hit limits:

- Create a new project at [aistudio.google.com](https://aistudio.google.com/app/apikey) and generate a fresh key
- Quota resets at midnight Pacific time
- The app falls back to offline content automatically when the API is unavailable
