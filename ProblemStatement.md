Build a futuristic web prototype for a ChatGPT feature called **Perspective Expansion Layer**.

The prototype should feel like a next-generation AI reasoning interface — not a traditional chatbot.

Tech Stack:

* React + TypeScript
* TailwindCSS
* Framer Motion for animations
* Use component-based clean architecture
* Dark theme by default
* Responsive layout
* Smooth micro-interactions
* No backend required (frontend prototype only)
* Use mock AI-generated data/static JSON
* Modern AI-native design aesthetic (OpenAI / Linear / Vercel inspired)

---

## CORE PRODUCT CONCEPT

This prototype solves the problem:

“High-frequency ChatGPT users struggle to identify what may be missing from AI-generated outputs within their workflow.”

Instead of showing a single authoritative answer, the system transforms AI interaction into a recursive exploration of perspectives.

The system:

* does NOT validate correctness directly
* does NOT show trust scores
* does NOT auto-modify outputs
* does NOT replace human judgment

Instead:

* AI surfaces perspective-triggered exploration prompts
* Users progressively explore hidden gaps and assumptions
* Conversation becomes a navigable cognitive exploration graph

The experience should feel:

* exploratory
* recursive
* intelligent
* agentic
* perspective-driven
* workflow-preserving

---

## MAIN UX FLOW

STEP 1:
User asks a question.

Example:
“Should I join this startup?”

---

STEP 2:
Main AI response appears in center chat area.

Example response:
“This startup may provide strong learning opportunities, faster ownership, and career acceleration compared to larger organizations.”

The primary answer should remain clean and uncluttered.

---

STEP 3:
Below the answer, AI automatically generates perspective-triggered exploration prompts.

These should appear as elegant rounded clickable chips/cards.

Example prompts:

* “What assumptions exist about company growth?”
* “How would this affect work-life balance?”
* “What happens if funding slows down?”
* “Would this still make sense in 5 years?”
* “How sensitive is this decision to market conditions?”

IMPORTANT:
Do NOT call them “agents”.

Users should feel:
they are exploring reasoning paths naturally.

---

STEP 4:
When user clicks a prompt:
DO NOT replace the chat.

Instead:
open a contextual side exploration panel on the right side.

The main answer must stay visible.

The side panel becomes a dedicated reasoning branch.

Example:
Panel title:
“Market Conditions Perspective”

Panel content:

* AI explanation
* risks
* assumptions
* implications
* hidden tradeoffs

At the bottom of this side panel:
new recursive perspective prompts should appear again.

Example:

* “What if hiring freezes increase?”
* “Would compensation still justify the risk?”
* “How resilient is startup survival during downturns?”

---

STEP 5:
Recursive Exploration

When user clicks prompts inside side panel:
new nested exploration nodes should appear INSIDE the side panel.

The UI should visually feel like:

* branching thought exploration
* recursive reasoning
* navigable cognition

NOT:

* linear chat

---

## RECURSIVE BRANCHING RULES

The reasoning system should support recursive exploration, but in a controlled and readable manner.

1. Maximum visible recursion depth:

* Support up to 3 branching levels deep
* Avoid infinite nesting
* Deeper levels should collapse automatically

Example:

Root Answer
├── Perspective Level 1
│      ├── Sub-perspective Level 2
│      │      ├── Sub-perspective Level 3
│
│      (Further levels become summarized/collapsed)

2. Branch expansion behavior:

* Only one deeply expanded branch should remain active at a time
* Other branches stay collapsed but accessible
* Users should always preserve previous exploration paths

3. Persistent Perspective Availability

* Previously generated perspective prompts must remain visible even after a user explores one perspective.
* Exploring one branch should NEVER replace or remove other available exploration paths.
* Users must be able to:

  * return to root-level prompts
  * explore alternate perspectives later
  * maintain multiple parallel reasoning branches

Example:

Root Answer
├── Funding Perspective (expanded)
├── Work-Life Perspective (still visible)
├── Growth Assumption Perspective (still visible)

The experience should feel like:
“parallel cognitive exploration”
rather than
“linear conversational replacement.”

4. Parallel Branch Persistence

* Multiple reasoning branches can coexist simultaneously.
* Expanding one branch should not collapse unrelated branches automatically.
* Each branch maintains its own recursive exploration history.

5. Branch Navigation UX

* Users should be able to:

  * jump between branches
  * reopen previous branches
  * compare different exploration paths
  * preserve reasoning continuity across perspectives


6. Side panel behavior:

* Recursive reasoning remains inside the side exploration panel
* Main answer window remains stable and unchanged
* Side panel becomes scrollable for deep explorations

7. Navigation:

* Add breadcrumb navigation:
  Example:
  Root → Market Perspective → Funding Risks → Hiring Freeze

* Allow users to jump back to previous reasoning levels instantly

8. Branch management:

* Users can:

  * collapse branches
  * reopen branches
  * switch reasoning paths
  * return to root answer

9. Recursive prompt generation:
   Each branch can generate:

* 3–5 additional perspective-triggered prompts maximum
* Avoid excessive prompt explosion

10. Cognitive load management:

* Use progressive disclosure
* Do not reveal all branches simultaneously
* Prioritize clarity over density

The goal is:
“deep but manageable cognitive exploration.”


---

## IMPORTANT UX REQUIREMENTS

1. WORKFLOW CONTINUITY

* Original answer must never disappear
* User should never lose previous branches
* Preserve exploration state

2. PERSISTENT REASONING GRAPH

* Maintain collapsible exploration tree
* User can revisit older branches
* User can collapse/expand nodes
* Keep navigation intuitive

3. PROGRESSIVE DEPTH

* Start lightweight
* Reveal complexity only on interaction

4. NO OVERWHELM

* Keep UI elegant and minimal
* Avoid giant trees on screen initially

5. SIDE EXPLORATION MODEL

* Main chat center
* Exploration on right
* Recursive reasoning inside side panel

6. HUMAN-JUDGMENT SUPPORT

* Never imply AI is final authority
* Use exploratory language
* Preserve ambiguity where needed

---

## DESIGN SYSTEM

Use:

* glassmorphism subtle effects
* soft shadows
* AI-native gradients
* smooth animations
* modern spacing
* rounded corners
* subtle connecting branch lines
* elegant hover states

Typography:

* clean sans-serif
* readable hierarchy
* premium feel

---

## COMPONENTS TO BUILD

1. MainChatWindow
2. AIAnswerCard
3. PerspectivePromptChips
4. ExplorationSidePanel
5. RecursiveReasoningNode
6. BranchNavigator
7. CollapsibleReasoningTree
8. PromptInputBar
9. ExplorationBreadcrumbs
10. PerspectiveInsightCard

---

-----------------------------------
LLM API INTEGRATION
-----------------------------------

This prototype supports real LLM-generated responses via a secure backend.

The API key is stored server-side only — never in the frontend:

**Backend** — `server/.env`:
```
LLM_API_KEY=your_api_key_here
LLM_MODEL=gemini-2.5-flash-lite
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** — `.env` at project root:
```
VITE_API_BASE_URL=http://localhost:3001
```

The frontend LLM service layer (`src/services/llmService.ts`) makes `fetch` calls to the Express backend.
The backend (`server/`) holds the Gemini SDK, API key, and prompt engineering — nothing sensitive reaches the browser.

**Backend API (Express — `server/src/`):**
- `POST /api/explore` — returns `{ answer, prompts[] }` (replaces generatePrimaryAnswer + generatePerspectivePrompts)
- `POST /api/expand` — returns `{ title, content, risks[], ..., childPrompts[] }` (replaces expandPerspectiveBranch + generateRecursivePrompts)

4. generateRecursivePrompts(branchContext)
- After a branch response is generated, create 3–5 deeper follow-up prompts related to that branch.
- Support recursion up to 3 levels.

-----------------------------------
REASONING ORCHESTRATION ENGINE
-----------------------------------

Build a frontend orchestration layer:

src/engine/perspectiveEngine.ts

This engine should:
- maintain the reasoning graph
- track root answer
- track selected branches
- preserve previous branches
- generate recursive perspective prompts
- prevent infinite nesting
- limit depth to 3
- keep all explored paths accessible
- allow users to revisit previous branches
- never overwrite the main answer

The engine should transform interaction from linear chat into a branching cognitive exploration graph.

-----------------------------------
SYSTEM PROMPT FOR PERSPECTIVE GENERATION
-----------------------------------

When generating perspective prompts, use this instruction:

“You are a Perspective Expansion Engine. Your job is not to fact-check, score, or rewrite the answer. Your job is to help the user identify what may be missing from the AI-generated output by creating context-relevant exploration prompts. Generate prompts that reveal hidden assumptions, missing context, overlooked trade-offs, stakeholder impacts, long-term consequences, risk factors, and alternative interpretations. Preserve ambiguity and support human judgment.”

-----------------------------------
IMPORTANT BEHAVIOR
-----------------------------------

The system should:
- generate the primary answer using the LLM
- generate perspective prompts using the LLM
- generate side-panel branch answers using the LLM
- generate deeper recursive prompts using the LLM
- preserve all previous branches
- allow user-created custom questions as new branches
- keep the main answer unchanged
- never automatically modify the original output
- never say “this is correct” or “this is wrong”
- always frame branch outputs as exploratory perspectives

---

## STATE MANAGEMENT

Need local state for:

* active branch
* expanded nodes
* recursive exploration history
* selected perspectives
* side panel state

Use React Context or Zustand.

---

## MOCK DATA

Create mock AI responses and recursive prompts for:

1. Startup decision
2. Resume review
3. System architecture decision

Each should demonstrate:

* recursive perspective generation
* branching exploration
* evolving reasoning paths

---

## ANIMATIONS

Use Framer Motion for:

* side panel opening
* branch expansion
* recursive node reveal
* chip hover effects
* smooth transitions

The interface should feel alive and intelligent.

---

## FINAL EXPERIENCE SHOULD FEEL LIKE

Combination of:

* ChatGPT
* Figma comments
* GitHub code review threads
* Mind-map exploration
* Cognitive navigation system

NOT:
traditional chat UI.

---

## LANDING HEADER

Top title:
“Perspective Expansion Layer”

Subtitle:
“Explore what may be missing from AI-generated outputs through recursive cognitive perspectives.”

---

## BONUS FEATURES (IF POSSIBLE)

* Mini reasoning-map overview
* Branch minimap
* “Return to root answer” button
* Smooth branch breadcrumbs
* Perspective heat indicators
* Subtle AI-thinking animation

---

## MOST IMPORTANT PRODUCT PRINCIPLE

The system transforms AI interaction from:
“answer consumption”

into:
“recursive cognitive exploration.”

This principle should be reflected throughout the entire UX.
