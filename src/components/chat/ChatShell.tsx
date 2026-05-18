import { AnimatePresence } from 'framer-motion'
import { PanelLeft, Plus, Search, MoreHorizontal } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import ExplorationSidePanel from '../exploration/ExplorationSidePanel'
import AIAnswerCard from './AIAnswerCard'
import PromptInputBar from './PromptInputBar'
import MiniMap from '../shared/MiniMap'

const CHAT_HISTORY = ['Startup decision', 'Resume review', 'System architecture', 'Market research']

export default function ChatShell() {
  const sidePanelOpen = useExplorationStore((s) => s.sidePanelOpen)
  const sessions = useExplorationStore((s) => s.sessions)
  const chatHistory = useExplorationStore((s) => s.chatHistory)
  const rootStatus = useExplorationStore((s) => s.rootStatus)
  const showPanel = sidePanelOpen || sessions.length > 0

  return (
    <div className="h-screen w-full bg-[#212121] text-[#ececec] flex font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#171717] border-r border-white/10 flex flex-col">
        <div className="p-3 flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/10">
            <PanelLeft size={20} />
          </button>
          <button className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm">
            <Plus size={18} />
            New chat
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-sm text-[#b4b4b4]">
            <Search size={16} />
            Search chats
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {CHAT_HISTORY.map((item) => (
            <div
              key={item}
              className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 text-sm cursor-pointer"
            >
              <span className="truncate">{item}</span>
              <MoreHorizontal size={16} className="opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-sm font-semibold">
              J
            </div>
            <div className="text-sm">
              <div>Jaswant</div>
              <div className="text-xs text-[#b4b4b4]">Free plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area + side panel — flex siblings so panel pushes chat width */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-5 border-b border-white/10">
          <div className="text-lg font-medium">ChatGPT</div>
          <button className="px-3 py-1.5 rounded-full border border-white/15 text-sm hover:bg-white/10">
            Share
          </button>
        </header>

        {/* Chat content */}
        <section className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Empty state — shown before any question is asked */}
            {rootStatus === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center gap-3">
                <div className="text-4xl opacity-20">✦</div>
                <div className="text-lg font-medium text-[#ececec]">
                  What would you like to explore?
                </div>
                <div className="text-sm text-[#b4b4b4] max-w-sm">
                  Ask any question. ChatGPT will answer, then you can expand hidden assumptions,
                  risks, and alternative perspectives.
                </div>
              </div>
            )}

            {/* Conversation history — past Q&A turns (read-only) */}
            {chatHistory.map((item, i) => (
              <div key={i} className="space-y-6">
                {/* Past user message */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-3xl bg-[#303030] px-5 py-3 text-[15px] leading-relaxed">
                    {item.question}
                  </div>
                </div>
                {/* Past AI answer (no chips — exploration is in history panel) */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    ✦
                  </div>
                  <p className="flex-1 text-[15px] leading-7 text-[#ececec] opacity-70 pt-1">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}

            {/* Dynamic answer + chips */}
            <AIAnswerCard />
          </div>
        </section>

        {/* Dynamic input bar */}
        <PromptInputBar />
        </main>

        {/* Exploration side panel — slides in from right */}
        <AnimatePresence>
          {showPanel && <ExplorationSidePanel />}
        </AnimatePresence>
      </div>

      {/* MiniMap — fixed bottom-right, slides away when side panel opens */}
      <MiniMap />
    </div>
  )
}
