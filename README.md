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
| LLM | Google Gemini (`gemini-2.5-flash-lite`) via `@google/generative-ai` (server-side) |
| Backend | Node.js + Express + TypeScript (`server/`) |
| Animation | Framer Motion 11 |
| Styling | TailwindCSS 3 |
| Icons | Lucide React |

---

## Project Structure

```
# Frontend (Vite + React)
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
│   └── llmService.ts                  — fetch wrapper that calls the backend API
├── store/
│   └── explorationStore.ts            — Zustand store + engine adapter
├── data/
│   └── fallback/
│       └── genericFallback.ts         — client-side fallback content
├── types/
│   └── index.ts                       — shared TypeScript types
└── animations/
    └── variants.ts                    — Framer Motion animation variants

# Backend (Node.js + Express)
server/
├── src/
│   ├── routes/
│   │   └── generate.ts                — POST /api/explore, POST /api/expand
│   ├── services/
│   │   └── llmService.ts              — Gemini SDK calls + retry logic
│   ├── prompts/
│   │   └── systemPrompts.ts           — prompt engineering constants
│   ├── data/
│   │   └── genericFallback.ts         — server-side fallback responses
│   ├── types/
│   │   └── index.ts                   — API request/response types
│   └── index.ts                       — Express app entry point
├── .env                               — LLM_API_KEY (never committed)
├── .env.example                       — template for required variables
└── package.json
```

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd ChatgptPerspective
npm install
```

### 2. Install backend dependencies

```bash
cd server
npm install
cd ..
```

### 3. Set up environment

**Frontend** — create `.env` at the project root:
```
VITE_API_BASE_URL=http://localhost:3001
```

**Backend** — create `server/.env`:
```
LLM_API_KEY=your_google_api_key_here
LLM_MODEL=gemini-2.5-flash-lite
PORT=3001
FRONTEND_URL=http://localhost:5173
```

Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey). Create a **new project** for a fresh quota.

> **Never commit `.env` or `server/.env`** — both are already in `.gitignore`.

### 4. Run both servers

**Terminal 1 — Backend:**
```bash
cmd /c "cd server && node_modules\.bin\tsx src/index.ts"
```

**Terminal 2 — Frontend:**
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
| Business logic in backend | API key never exposed to the browser; Gemini SDK runs server-side only |
| 1 API call per user action | Combines answer + chips (or branch + child chips) in a single JSON response to stay within free-tier rate limits |
| `gemini-2.5-flash-lite` | Fast, capable model with available free-tier quota |
| Framing as "exploratory perspectives" | System prompts explicitly avoid "correct/wrong" language; outputs are always presented as possibilities, never verdicts |
| Max depth = 3 | Prevents runaway recursion; terminal nodes render as collapsed summaries |
| L1 branches are always parallel | Expanding one branch never auto-collapses another; all parallel explorations remain visible |
| Conversation history in LLM context | Full prior Q&A is prepended to each new question so follow-ups resolve correctly |

---

## Environment Variables

**Frontend** (`.env` at project root):

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (default: `http://localhost:3001`) |

**Backend** (`server/.env`):

| Variable | Description |
|----------|-------------|
| `LLM_API_KEY` | Google Gemini API key — **never exposed to browser** |
| `LLM_MODEL` | Gemini model name (default: `gemini-2.5-flash-lite`) |
| `PORT` | Backend port (default: `3001`) |
| `FRONTEND_URL` | Allowed CORS origin (default: `http://localhost:5173`) |

> Restart the relevant server after changing its `.env`.

---

## Deployment

The project is deployed as two separate services:

| Service | Platform | Purpose |
|---------|----------|---------|
| Backend (`server/`) | [Render](https://render.com) | Express API, Gemini SDK, API key storage |
| Frontend (`src/`) | [Vercel](https://vercel.com) | Vite + React app, static hosting |

**Backend (Render):**
- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variables: `LLM_API_KEY`, `LLM_MODEL`, `FRONTEND_URL` (set to Vercel URL)

**Frontend (Vercel):**
- Root Directory: `/`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `VITE_API_BASE_URL` (set to Render URL)

> After deploying both, update `FRONTEND_URL` on Render to the Vercel URL to enable CORS.

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
