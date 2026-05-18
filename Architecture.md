# Phase-Wise Architecture: Perspective Expansion Layer

> **Core Principle:** AI interaction transformed from linear conversation into recursive cognitive exploration.

---

## Deployment Status

| Layer | Platform | Notes |
|-------|----------|-------|
| Backend (`server/`) | Render | Express + Gemini SDK; API key secured as env var |
| Frontend (`src/`) | Vercel | Vite static build; `VITE_API_BASE_URL` points to Render |

Both services are live and connected. CORS is configured via `FRONTEND_URL` on the Render service.

---

## Existing Foundation: ChatGPT Shell (`ChatgptUI.html`)

> **Context:** The Growth PM has already authored a production-faithful ChatGPT shell component. This is the starting point — not a blank canvas. All subsequent phases build on top of it, not alongside it.

**What is already built:**

| UI Element | Status | Notes |
|------------|--------|-------|
| Sidebar with chat history list | ✅ Done | 4 mock chat items, search, new chat button |
| Header bar | ✅ Done | "ChatGPT" title + Share button |
| User message bubble | ✅ Done | Right-aligned, `bg-[#303030]` pill style |
| AI answer message | ✅ Done | Avatar + prose response |
| `PerspectivePromptChips` (static) | ✅ Done | 4 hardcoded chips rendered below AI answer |
| `PromptInputBar` | ✅ Done | Textarea + send button + Plus icon |
| Dark theme tokens | ✅ Done | `#212121` bg, `#171717` sidebar, `#10a37f` accent |

**What is NOT yet built (remaining work):**
- Real LLM API integration
- LLM service layer (`src/services/llmService.ts`)
- Perspective orchestration engine (`src/engine/perspectiveEngine.ts`)
- Zustand state management (with LLM + branch state)
- Dynamic scenario / question handling
- `ExplorationSidePanel` (recursive reasoning)
- `RecursiveReasoningNode` (branching tree)
- `ExplorationBreadcrumbs` + `BranchNavigator`
- Fallback mock data layer (3 scenarios × 3 depth levels)
- Framer Motion animations
- Custom user-created exploration branches

**Migration step:** Rename `ChatgptUI.html` → `src/components/chat/ChatShell.tsx` and wire into `App.tsx` as root layout.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React UI Layer                            │
│  ChatShell ─── MainChatWindow ─── ExplorationSidePanel          │
│       │               │                    │                     │
│  PromptInputBar  AIAnswerCard     RecursiveReasoningNode         │
│                  PerspectivePromptChips  ExplorationBreadcrumbs  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ reads/writes
┌──────────────────────────▼──────────────────────────────────────┐
│                    Zustand Store Layer                           │
│   explorationStore.ts — reasoning graph + UI state + LLM state  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ dispatches
┌──────────────────────────▼──────────────────────────────────────┐
│               Perspective Orchestration Engine                   │
│   src/engine/perspectiveEngine.ts                               │
│   — reasoning graph management                                   │
│   — branch lifecycle (expand / collapse / persist / revisit)    │
│   — depth enforcement (max 3)                                    │
│   — custom branch injection                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ calls
┌──────────────────────────▼──────────────────────────────────────┐
│                      LLM Service Layer                           │
│   src/services/llmService.ts                                     │
│   generateRootExploration()      ← answer + chips in 1 call     │
│   expandBranchWithPrompts()      ← content + chips in 1 call    │
│   generatePrimaryAnswer()        ← kept for reference only      │
│   generatePerspectivePrompts()   ← kept for reference only      │
│   expandPerspectiveBranch()      ← kept for reference only      │
│   generateRecursivePrompts()     ← kept for reference only      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ fallback
┌──────────────────────────▼──────────────────────────────────────┐
│                     Fallback Mock Data                           │
│   src/data/scenarios/ — used when LLM unavailable               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 0 — Project Scaffolding & Design System

**Goal:** Wrap the existing shell into a proper Vite + React + TypeScript project and set up the environment.

**Steps:**
1. `npm create vite@latest` → React + TypeScript
2. Install dependencies:
   ```
   tailwindcss framer-motion zustand clsx lucide-react
   ```
3. Create environment files:

   **Frontend** — `.env` at project root:
   ```
   VITE_API_BASE_URL=http://localhost:3001
   ```

   **Backend** — `server/.env`:
   ```
   LLM_API_KEY=your_google_api_key_here
   LLM_MODEL=gemini-2.5-flash-lite
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```
   Add `server/.env` and `.env` to `.gitignore` — **never commit the API key.**
   > Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey). The `LLM_API_KEY` is read only by the backend server and never exposed to the browser.
4. Migrate `ChatgptUI.html` → `src/components/chat/ChatShell.tsx` (already uses `lucide-react` icons)
5. Extend TailwindCSS config:
   - Keep existing ChatGPT palette (`#212121`, `#171717`, `#10a37f`) — **do not change**
   - Add exploration layer accents: indigo→violet gradient
   - Custom utilities: `glass`, `branch-line`, `glow` (scoped to side panel only)

6. Full folder structure:

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatShell.tsx               ← migrated from ChatgptUI.html
│   │   ├── AIAnswerCard.tsx             ← extracted + made dynamic
│   │   ├── PerspectivePromptChips.tsx   ← extracted + made dynamic
│   │   └── PromptInputBar.tsx           ← extracted + made dynamic
│   ├── exploration/
│   │   ├── ExplorationSidePanel.tsx
│   │   ├── ExplorationBreadcrumbs.tsx
│   │   ├── PerspectiveInsightCard.tsx
│   │   ├── RecursiveReasoningNode.tsx
│   │   └── CollapsibleReasoningTree.tsx
│   ├── navigation/
│   │   ├── BranchNavigator.tsx
│   │   └── ReturnToRootButton.tsx
│   └── shared/
│       ├── ThinkingIndicator.tsx        ← 3-dot pulse animation
│       ├── ShimmerSkeleton.tsx
│       └── MiniMap.tsx
├── engine/
│   └── perspectiveEngine.ts            ← orchestration engine
├── services/
│   └── llmService.ts                   ← LLM API calls
├── store/
│   └── explorationStore.ts             ← Zustand store
├── data/
│   └── scenarios/
│       ├── startup.ts
│       ├── resume.ts
│       └── architecture.ts
├── hooks/
│   ├── usePerspectiveEngine.ts
│   └── useLLMStream.ts
├── types/
│   └── index.ts
├── animations/
│   └── variants.ts
└── prompts/
    └── systemPrompts.ts                ← prompt engineering constants
```

---

## Phase 1 — TypeScript Data Model

**Goal:** Define the complete type system that the engine, store, and UI all share.

**File:** `src/types/index.ts`

```ts
// ─── Core Node ───────────────────────────────────────────────
export type NodeStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PerspectiveNode {
  id: string;
  parentId: string | null;
  depth: number;                  // 0 = root, max 3
  question: string;               // the prompt that triggered this node
  title: string;                  // display title for the panel header
  content: string;                // AI-generated explanation
  risks: string[];
  assumptions: string[];
  implications: string[];
  hiddenTradeoffs: string[];
  childPrompts: PromptChip[];     // 3–5 follow-up chips
  isExpanded: boolean;
  isCustom: boolean;              // true if user typed this branch manually
  status: NodeStatus;             // LLM loading state for this node
  createdAt: number;              // timestamp for branch ordering
}

// ─── Prompt Chip ─────────────────────────────────────────────
export interface PromptChip {
  id: string;
  label: string;
  heatScore: number;              // 0–1, drives heat indicator opacity
}

// ─── Reasoning Graph ─────────────────────────────────────────
export interface ReasoningGraph {
  rootQuestion: string;
  rootAnswer: string;
  rootStatus: NodeStatus;
  rootPrompts: PromptChip[];      // level-1 chips below the main answer
  nodes: Record<string, PerspectiveNode>;
}

// ─── LLM Context passed to service functions ─────────────────
export interface LLMContext {
  userPrompt: string;
  primaryAnswer: string;
  branchPath: string[];           // ordered node IDs from root to current
  currentQuestion: string;
  depth: number;
}

// ─── Scenario ────────────────────────────────────────────────
export type ScenarioKey = 'startup' | 'resume' | 'architecture';

export interface ScenarioSeed {
  key: ScenarioKey;
  question: string;
  label: string;
}
```

---

## Phase 2 — LLM Service Layer

**Goal:** Encapsulate all LLM API calls behind a typed service. UI and engine never call `fetch` directly.

**File:** `src/services/llmService.ts`

**File:** `src/services/llmService.ts` (frontend — fetch wrapper only)

**Backend LLM service:** `server/src/services/llmService.ts` (Gemini SDK + retry logic)

**The frontend no longer calls Gemini directly.** `src/services/llmService.ts` only makes `fetch` calls to the Express backend at `VITE_API_BASE_URL`. The Gemini SDK, API key, and prompt engineering are all in `server/`.

**Backend API endpoints (Express, `server/src/routes/generate.ts`):**
- `POST /api/explore` → calls `explore()` → returns `{ answer, prompts[] }`
- `POST /api/expand` → calls `expand()` → returns `{ title, content, risks[], ..., childPrompts[] }`

**Frontend fetch pattern:**
```ts
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}
```

**Active engine-facing functions (2 combined calls replace 4 sequential ones):**

### `generateRootExploration(userPrompt: string): Promise<RootExplorationResult>`
- **Replaces** `generatePrimaryAnswer` + `generatePerspectivePrompts` — **1 API call instead of 2**
- System instruction: `ROOT_EXPLORATION_PROMPT` — asks model to return answer + chips together
- `responseMimeType: 'application/json'`
- Response schema: `{ answer: string, prompts: [{ id, label, heatScore }] }`
- Engine calls this on `startExploration()`

### `expandBranchWithPrompts(ctx: LLMContext): Promise<BranchWithPromptsResult>`
- **Replaces** `expandPerspectiveBranch` + `generateRecursivePrompts` — **1 API call instead of 2**
- System instruction: `BRANCH_WITH_PROMPTS_PROMPT` — returns full branch content + child chips together
- `responseMimeType: 'application/json'`
- Response schema: `{ title, content, risks[], assumptions[], implications[], hiddenTradeoffs[], prompts[] }`
- Engine calls this on `expandBranch()` and `createCustomBranch()`

**Legacy functions (kept in service, not called by engine):**
- `generatePrimaryAnswer()`, `generatePerspectivePrompts()`, `expandPerspectiveBranch()`, `generateRecursivePrompts()` — preserved for reference

**Error handling:**
- All functions catch API errors and return a structured `{ error: string }` discriminated union
- Engine logs `console.error('[Engine] ...')` at every fallback point for DevTools visibility
- Calling code falls back to generic fallback data from `src/data/fallback/genericFallback.ts`

### Phase 2a — Prompt Engineering Layer

**File:** `src/prompts/systemPrompts.ts`

Four legacy prompts (`PERSPECTIVE_SYSTEM_PROMPT`, `BRANCH_EXPANSION_PROMPT`, `RECURSIVE_PROMPTS_SYSTEM_PROMPT`, `PRIMARY_ANSWER_SYSTEM_PROMPT`) are retained. The engine now uses two combined prompts:

```ts
// Used by generateRootExploration() — answer + chips in one call
export const ROOT_EXPLORATION_PROMPT = `
You are a thoughtful AI assistant and Perspective Expansion Engine combined.
First, answer the user's question clearly and helpfully in plain prose (2–4 paragraphs).
Then, generate 3 to 5 perspective exploration prompts that surface what may be missing.
Return valid JSON: { "answer": "string", "prompts": [{ "id", "label", "heatScore" }] }
`;

// Used by expandBranchWithPrompts() — branch content + child chips in one call
export const BRANCH_WITH_PROMPTS_PROMPT = `
You are expanding a reasoning perspective AND generating follow-up prompts.
Explain what this perspective reveals using exploratory language.
Then generate 3 to 5 deeper follow-up prompts scoped to this branch.
Return valid JSON: { "title", "content", "risks[]", "assumptions[]",
  "implications[]", "hiddenTradeoffs[]", "prompts": [{ "id", "label", "heatScore" }] }
`;
```

---
## Phase 3 — Generic Fallback & Empty-State Layer

**Goal:** Provide graceful handling when the LLM is unavailable due to network error, missing API key, or rate limits. This layer should not define fixed use-case scenarios because the product must work across any ChatGPT workflow.

**Files:** `src/data/fallback/`

| File | Purpose |
|------|---------|
| `genericFallback.ts` | Generic fallback answer and perspective prompts |
| `emptyState.ts` | Default empty-state examples shown before user starts |
| `errorStates.ts` | User-facing messages for API failure, rate limit, or missing key |

**Fallback behavior:**
- The engine always attempts the LLM first.
- If LLM fails, show a generic fallback message.
- Do not use hardcoded scenario-specific reasoning graphs.
- Do not pre-author full 3-level graphs for resume, startup, or architecture.
- Generate branches only from actual user input.
- If fallback is needed, show generic prompts such as:
  - “What context might be missing here?”
  - “What assumptions could this response depend on?”
  - “What risks or trade-offs should be explored?”
  - “What would change under a different perspective?”

**Usage rule:** Mock/fallback data is only for graceful degradation and UI continuity, not for driving the default product experience.

## Phase 4 — Perspective Orchestration Engine

**Goal:** A pure TypeScript module that owns all reasoning graph logic. Components and the store call the engine — the engine decides what to fetch, how to update the graph, and how to enforce depth limits.

**File:** `src/engine/perspectiveEngine.ts`

**Responsibilities:**

| Concern | Engine Behavior |
|---------|----------------|
| Root answer generation | Calls `llmService.generatePrimaryAnswer()`, writes to graph |
| Root prompt generation | Calls `llmService.generatePerspectivePrompts()` after root answer |
| Branch expansion | Calls `llmService.expandPerspectiveBranch()` for a selected chip |
| Recursive prompts | Calls `llmService.generateRecursivePrompts()` after branch expands |
| Depth enforcement | Refuses to expand nodes at `depth >= 3`; marks them as terminal |
| Parallel branch coexistence | **Expanding one branch never collapses other L1 branches** — all root-level perspectives stay expanded and visible simultaneously |
| Intra-branch collapse | Within a single branch's sub-tree (depth 2–3), only one child sub-branch is active at a time to prevent deep nesting overload |
| Branch preservation | Expanded nodes are **never deleted** from the graph — only collapsed |
| Custom branches | Accepts user-typed text → creates a `PerspectiveNode` with `isCustom: true` |
| Revisit | Any previously explored node can be re-expanded; content is cached in graph |
| Fallback | On LLM error, loads matching seed data from `src/data/scenarios/` |
| Root protection | `rootAnswer` field in `ReasoningGraph` is write-once — never overwritten |

**Core engine functions:**

```ts
// Initialize a new question
async function startExploration(userPrompt: string): Promise<void>

// Expand a chip into a full branch node
async function expandBranch(chipId: string, parentNodeId: string | null): Promise<void>

// Collapse a branch (preserves content in graph)
function collapseBranch(nodeId: string): void

// Jump to a previously explored node
function navigateToNode(nodeId: string): void

// User creates a custom branch from free text
async function createCustomBranch(userText: string, parentNodeId: string | null): Promise<void>

// Return to root — collapses all panels, preserves graph
function returnToRoot(): void

// Compute breadcrumb path for a node
function getBreadcrumbPath(nodeId: string): PerspectiveNode[]
```

**Depth enforcement logic:**
```
depth 0 = root answer (always visible in MainChatWindow)
depth 1 = first perspective (opens side panel)
depth 2 = sub-perspective (rendered inside side panel, nested)
depth 3 = leaf perspective (rendered collapsed/summary only, no further expansion)
depth > 3 = blocked by engine; createCustomBranch also blocked at depth 3
```

---

## Phase 5 — State Management (Zustand Store)

**Goal:** Single source of truth for all UI state and the reasoning graph. The engine writes to the store; components read from it.

**File:** `src/store/explorationStore.ts`

```ts
interface ExplorationStore {
  // ─── Reasoning Graph ───────────────────────────────────────
  graph: ReasoningGraph | null;

  // ─── Scenario / Session ────────────────────────────────────
  activeScenario: ScenarioKey | null;
  userQuestion: string;
  setUserQuestion: (q: string) => void;

  // ─── LLM Global State ──────────────────────────────────────
  rootStatus: NodeStatus;           // loading state of the primary answer
  setRootStatus: (s: NodeStatus) => void;
  updateNode: (nodeId: string, patch: Partial<PerspectiveNode>) => void;
  setGraph: (graph: ReasoningGraph) => void;

  // ─── Side Panel ────────────────────────────────────────────
  sidePanelOpen: boolean;
  activePanelNodeId: string | null;
  openSidePanel: (nodeId: string) => void;
  closeSidePanel: () => void;

  // ─── Breadcrumb Trail ──────────────────────────────────────
  breadcrumbPath: string[];         // ordered node IDs from root to active
  setBreadcrumbPath: (path: string[]) => void;

  // ─── Active Branches (parallel) ───────────────────────────
  expandedBranchIds: Set<string>;   // all currently expanded L1 branch node IDs
  activeFocusNodeId: string | null; // the branch the user most recently interacted with
  toggleBranch: (nodeId: string) => void;    // expand if collapsed, collapse if expanded
  setActiveFocus: (nodeId: string) => void;

  // ─── Navigation ────────────────────────────────────────────
  navigateTo: (nodeId: string) => void;
  returnToRoot: () => void;

  // ─── Custom Branch ─────────────────────────────────────────
  pendingCustomPrompt: string;
  setPendingCustomPrompt: (text: string) => void;
}
```

**Store invariants:**
- `graph.rootAnswer` is never overwritten after first set
- `expandedBranchIds` tracks all simultaneously open L1 branch IDs — no forced mutual exclusion at L1
- `breadcrumbPath` is always derived from `parentId` chain — never manually constructed
- Node `status: 'loading'` shows `ThinkingIndicator`; `status: 'ready'` shows content
- Collapsed nodes remain in `graph.nodes` with `isExpanded: false` — content is preserved
- Root-level `PromptChips` are **always rendered** regardless of how many branches are open

---

## Phase 6 — Core Layout & Shell Extension

**Goal:** Extend `ChatShell.tsx` into the full Perspective Expansion layout without changing its visual appearance.

**Component tree after extension:**

```
App.tsx
└── ChatShell.tsx  (existing — do not restyle)
    ├── Sidebar              ← existing, unchanged
    ├── MainChatWindow       ← existing chat area, flex-shrinks when panel opens
    │   ├── ScenarioSelector ← NEW: 3 pill chips injected in header bar
    │   ├── AIAnswerCard     ← extracted + dynamic + LLM-driven
    │   ├── PerspectivePromptChips ← extracted + dynamic + LLM-driven
    │   └── PromptInputBar   ← extracted + calls engine.startExploration()
    └── ExplorationSidePanel ← NEW: slides in from right
        ├── ExplorationBreadcrumbs
        ├── CollapsibleReasoningTree
        │   └── RecursiveReasoningNode (self-referential, max depth 3)
        │       ├── PerspectiveInsightCard
        │       └── PerspectivePromptChips (recursive)
        ├── BranchNavigator
        └── ReturnToRootButton
```

**Layout rules:**
- `MainChatWindow`: `flex-1` → transitions to `max-w-[calc(100%-420px)]` when panel opens
- `ExplorationSidePanel`: `w-[420px]`, `x: 420→0` via Framer Motion spring; uses `#1a1a2e` with glass overlay to complement existing `#212121`
- Sidebar remains fixed and unchanged at `w-[260px]`

---

## Phase 7 — Main Chat Window Components

**Goal:** Extract static pieces from `ChatShell.tsx` and wire them to the engine.

1. **`PromptInputBar`** ← extract, keep markup identical
   - On submit: calls `engine.startExploration(userQuestion)`
   - Shows disabled state while `rootStatus === 'loading'`
   - Framer Motion: `whileFocus: { scale: 1.01 }`

2. **`AIAnswerCard`** ← extract, keep avatar + prose styles identical
   - While `rootStatus === 'loading'`: renders `ShimmerSkeleton`
   - While `rootStatus === 'ready'`: animates in with `opacity: 0→1`, `y: 8→0`
   - Content sourced from `graph.rootAnswer` in store

3. **`PerspectivePromptChips`** ← extract, keep chip styles identical
   - Sourced from `graph.rootPrompts` (LLM-generated or fallback seed)
   - **Always rendered** — chips never disappear when a branch opens
   - Chips show a visual "explored" state (filled dot indicator) when their branch is already in `expandedBranchIds`
   - On click: calls `engine.expandBranch(chip.id, null)` → `store.toggleBranch(nodeId)`
   - Heat indicator: chip border opacity scales with `chip.heatScore`
   - Staggered entrance: `staggerChildren: 0.07`, `y: 12→0`
   - Custom branch input: small `+` button appended after chips → inline text field → `engine.createCustomBranch()`

---

## Phase 8 — Side Exploration Panel & Recursive Nodes

**Goal:** The recursive reasoning workspace — the heart of the Perspective Expansion Layer.

### `ExplorationSidePanel`
- `AnimatePresence` + `x: 420→0` spring slide-in
- Header: "Exploration" label + branch count badge (e.g. `3 branches`) + close button
- Scrollable body: breadcrumbs + `CollapsibleReasoningTree` (all parallel branches)
- Panel stays open as long as `expandedBranchIds.size > 0`; auto-closes when last branch is collapsed

### `ExplorationBreadcrumbs`
- Reads `breadcrumbPath` from store
- Renders: `Root → Market Conditions → Funding Risks`
- Each crumb: clickable → `engine.navigateToNode(nodeId)`
- New crumbs: `x: 20→0` slide animation

### `PerspectiveInsightCard`
- Renders a single `PerspectiveNode`'s content
- Header: title + depth indicator dot (color-coded by depth level)
- Body: AI explanation paragraph
- Collapsible sections (Framer Motion `height` animation):
  - Risks / Assumptions / Implications / Hidden Tradeoffs
- Loading state: renders `ThinkingIndicator` when `node.status === 'loading'`

### `RecursiveReasoningNode`
- **Self-referential component** — props: `nodeId`, `depth`
- Renders: `PerspectiveInsightCard` + `PerspectivePromptChips` (recursive)
- At `depth === 3`: renders collapsed summary only, no expand button
- Branch connecting line: `border-l border-indigo-500/20` with `scaleY: 0→1` on expand
- On chip click inside panel: `engine.expandBranch(chip.id, nodeId)`

### `CollapsibleReasoningTree`
- Manages **all simultaneously expanded branches** within the side panel
- **Not an accordion** — multiple L1 branches render in parallel, stacked vertically in the panel
- Each branch is independently collapsible via its own collapse toggle
- Within a single branch's sub-tree (depth 2–3), accordion behavior applies: expanding a child collapses its siblings (intra-branch only)
- Preserves collapsed node content (content stays in store graph)
- Scroll position preserved per branch node via individual `scrollTop` refs
- Branch order: sorted by `createdAt` timestamp (oldest at top)

### Recursion depth rendering rules:

| Depth | Rendering | Collapse Behavior |
|-------|-----------|------------------|
| 0 | Root answer in `MainChatWindow` — never inside side panel | Never collapses |
| 1 | Full `PerspectiveInsightCard` + `PerspectivePromptChips` | Independent — closing one never affects others |
| 2 | Full `PerspectiveInsightCard` + `PerspectivePromptChips`, indented | Intra-branch accordion (siblings within same L1 branch) |
| 3 | Compact summary card only — "Max depth reached" label, no chips | Always collapsed by default |

---

## Phase 9 — Branch Navigation & Custom Branches

**Goal:** Users can traverse their full exploration history and inject their own questions.

### `BranchNavigator`
- Compact tree of all explored nodes (`graph.nodes` where `status === 'ready'`)
- Collapsed by default; toggled by tree icon in side panel header
- Currently expanded branches highlighted with filled indigo dot
- Previously explored but currently collapsed branches shown with hollow dot
- Custom branches marked with a pen icon
- Click any L1 node → `store.toggleBranch(nodeId)` (re-expands if collapsed)
- Click any L2/L3 node → `engine.navigateToNode(nodeId)` (scrolls to it within its parent branch)

### `ReturnToRootButton`
- Fixed at the bottom of `ExplorationSidePanel`
- Calls `engine.returnToRoot()` → closes panel, scrolls chat to top
- Framer Motion: fades in only when `breadcrumbPath.length > 0`

### Custom Branch Creation
- Available in two places:
  1. Below `PerspectivePromptChips` in `MainChatWindow` — for depth-1 custom branches
  2. Below chips inside `RecursiveReasoningNode` — for depth 2–3 (blocked at depth 3)
- UI: small "Ask your own question →" inline text input
- On submit: `engine.createCustomBranch(userText, parentNodeId)`
- Custom nodes rendered with a dashed border to distinguish from AI-generated branches

---

## Phase 10 — Animations & Micro-interactions

**File:** `src/animations/variants.ts`

| Animation | Trigger | Implementation |
|-----------|---------|----------------|
| Panel slide-in | `openSidePanel` | `x: 420→0`, `opacity: 0→1`, spring stiffness 300 |
| Chip entrance | Chips mount | `staggerChildren: 0.07`, `y: 12→0`, `opacity: 0→1` |
| Node reveal | `expandBranch` resolves | `height: 0→auto`, `opacity: 0→1` |
| Breadcrumb append | `navigateTo` | `x: 20→0` slide |
| AI thinking | `status === 'loading'` | `ThinkingIndicator`: 3-dot pulse |
| Shimmer skeleton | Root answer loading | CSS shimmer gradient sweep, 500ms |
| Branch line draw | Node expand | `scaleY: 0→1`, `transformOrigin: top` |
| Chip hover | `whileHover` | `scale: 1.02`, indigo glow `box-shadow` |
| Custom branch input | Focus | `width: 0→200px` expand |
| Panel close | `closeSidePanel` | `x: 0→420`, then unmount via `AnimatePresence` |

---

## Phase 11 — Bonus Features

1. **Mini Reasoning Map** (`src/components/shared/MiniMap.tsx`)
   - SVG bird's-eye view of `graph.nodes` tree
   - Nodes as small dots; active path highlighted in indigo
   - Fixed bottom-right corner, toggleable
   - Updates live as branches expand

2. **Perspective Heat Indicators**
   - `chip.heatScore` (0–1) returned by LLM or computed from mock data
   - Higher score = more opaque indigo border on chip
   - Signals "this path is worth exploring"

3. **AI Thinking Animation** (`ThinkingIndicator`)
   - 3 dots, staggered pulse (`scaleY` bounce)
   - Shown in `PerspectiveInsightCard` while `node.status === 'loading'`
   - Delay scales with depth: `depth * 200ms` simulated latency on mock fallback

---

## Component ↔ Engine Interaction Flow

```
User types question
  → PromptInputBar.onSubmit()
    → engine.startExploration(userPrompt)
      → llmService.generateRootExploration()     [1 call: answer + chips together]
      → store.setGraph(graph)                    [rootStatus: ready]
        → AIAnswerCard renders answer
        → PerspectivePromptChips renders L1 chips

User clicks a chip (first time)
  → engine.expandBranch(chipId, parentId=null)
    → store.updateNode(id, { status: 'loading' })
    → llmService.expandBranchWithPrompts(ctx)    [1 call: content + child chips together]
    → store.updateNode(id, { ...content, status: 'ready' })
    → store.toggleBranch(nodeId)                 [adds to expandedBranchIds]
    → ExplorationSidePanel slides in (if first branch)
      → PerspectiveInsightCard renders content
      → PerspectivePromptChips renders L2 chips
    → root-level chips remain visible, chip shows "explored" state indicator

User clicks a SECOND chip (parallel branch)
  → engine.expandBranch(chip2Id, parentId=null)
    → [same LLM flow]
    → store.toggleBranch(node2Id)                [adds to expandedBranchIds — both branches now open]
    → CollapsibleReasoningTree now shows BOTH branches stacked in side panel
    → first branch remains fully expanded — NOT collapsed

User clicks a chip inside side panel (depth+1)
  → engine.expandBranch(chipId, parentId=nodeId)
    → depth guard: if depth >= 3 → abort, render terminal node

User types a custom branch
  → engine.createCustomBranch(text, parentNodeId)
    → creates PerspectiveNode { isCustom: true }
    → same LLM expand flow as expandBranch

User clicks breadcrumb
  → engine.navigateToNode(nodeId)
    → store.setBreadcrumbPath([...path to node])
    → store.setActiveBranchPath([...path])
    → ExplorationSidePanel scrolls to that node
```

---

## Phase Delivery Order Summary

| Phase | Deliverable | Depends On |
|-------|-------------|------------|
| 0 | Project setup, env config, folder structure | — |
| 1 | TypeScript types (`types/index.ts`) | Phase 0 |
| 2 | LLM service layer + prompt engineering constants | Phase 1 types |
| 3 | Fallback mock data (3 scenarios × 3 levels deep) | Phase 1 types |
| 4 | Perspective orchestration engine | Phase 1, 2, 3 |
| 5 | Zustand store | Phase 1, 4 |
| 6 | Core layout & shell extension | Phase 5 store |
| 7 | Main chat window components (dynamic, LLM-driven) | Phase 5, 6 |
| 8 | Side panel + recursive nodes | Phase 4, 5, 7 |
| 9 | Branch navigation + custom branch creation | Phase 8 |
| 10 | Animations throughout ✅ | All phases |
| 11 | Bonus features (MiniMap, heat indicators) ✅ | Phase 8+ |

> **Post-launch optimisation:** API calls halved by combining sequential pairs into single JSON calls (`generateRootExploration`, `expandBranchWithPrompts`). Model changed to `gemini-2.5-flash-lite`. Gemini SDK and all LLM business logic moved to the Express backend (`server/`) — the frontend `llmService.ts` now only makes `fetch` calls to the backend API, keeping the API key out of the browser entirely.

---

## Critical Invariants (enforced across all phases)

| Invariant | Enforcement Point |
|-----------|------------------|
| `graph.rootAnswer` is write-once | Engine — `startExploration` only |
| Max depth = 3 | Engine — depth guard before any LLM call |
| **L1 branches are parallel — never auto-collapsed** | Engine — expanding a branch never calls `collapseBranch` on L1 siblings |
| Intra-branch sub-collapse (depth 2–3 only) | Engine — within one branch's sub-tree, expanding a child collapses its own siblings |
| Root-level chips always visible | `PerspectivePromptChips` — never unmounts; chips show explored/unexplored state |
| Collapsed nodes are never deleted | Store — `isExpanded: false`, content preserved |
| API key never in browser | `LLM_API_KEY` lives only in `server/.env`; frontend never sees it |
| LLM error falls back to mock data | `llmService` — all functions return discriminated union |
| Branch content never auto-modifies root answer | Engine — root is read-only after generation |
| Custom branches blocked at depth 3 | Engine — `createCustomBranch` depth guard |
| `breadcrumbPath` always truth-derived | Computed from `parentId` chain, never manually set |
| Side panel never replaces main chat | `ExplorationSidePanel` is always a sibling, never a replacement |
| Output framing always exploratory | System prompts enforce — never "correct/wrong", always "may/could/consider" |
| Each branch preserves its own exploration history | Store — `graph.nodes` keyed by ID; each branch's sub-tree is independent |
