import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import type { ReasoningGraph, PerspectiveNode } from '../../types'

// ─── Single explored node (read-only, no API calls) ──────────
function HistoryNode({ node }: { node: PerspectiveNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="text-[13px] text-[#ececec] leading-snug flex-1">{node.title || node.question}</span>
        {open ? (
          <ChevronUp size={13} className="shrink-0 text-[#b4b4b4]" />
        ) : (
          <ChevronDown size={13} className="shrink-0 text-[#b4b4b4]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-2 border-t border-white/10 space-y-2">
              <p className="text-[13px] text-[#b4b4b4] leading-relaxed">{node.content}</p>

              {node.risks?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-[#b4b4b4] mb-1">Risks</div>
                  <ul className="space-y-1">
                    {node.risks.map((r, i) => (
                      <li key={i} className="text-[12px] text-[#b4b4b4] flex gap-1.5">
                        <span className="text-white/20 shrink-0">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {node.assumptions?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-[#b4b4b4] mb-1">Assumptions</div>
                  <ul className="space-y-1">
                    {node.assumptions.map((a, i) => (
                      <li key={i} className="text-[12px] text-[#b4b4b4] flex gap-1.5">
                        <span className="text-white/20 shrink-0">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── One past session accordion ───────────────────────────────
function HistorySession({ session, index }: { session: ReasoningGraph; index: number }) {
  const [open, setOpen] = useState(false)

  const exploredNodes = Object.values(session.nodes)
    .filter((n) => n.status === 'ready')
    .sort((a, b) => a.createdAt - b.createdAt)

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="text-[11px] bg-indigo-500/20 text-indigo-300 rounded-full px-2 py-0.5 shrink-0">
          #{index + 1}
        </span>
        <span className="flex-1 text-[13px] text-[#ececec] leading-snug line-clamp-2">
          {session.rootQuestion}
        </span>
        {open ? (
          <ChevronUp size={14} className="shrink-0 text-[#b4b4b4]" />
        ) : (
          <ChevronDown size={14} className="shrink-0 text-[#b4b4b4]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-4 py-3 space-y-3">
              {/* Root answer */}
              <p className="text-[13px] text-[#b4b4b4] leading-relaxed">{session.rootAnswer}</p>

              {/* Explored perspective nodes */}
              {exploredNodes.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wide text-[#b4b4b4]">
                    Explored perspectives
                  </div>
                  {exploredNodes.map((node) => (
                    <HistoryNode key={node.id} node={node} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Root export ──────────────────────────────────────────────
export default function ExplorationHistory() {
  const sessions = useExplorationStore((s) => s.sessions)

  if (sessions.length === 0) return null

  return (
    <div className="px-4 py-4 border-t border-white/10">
      <div className="text-[11px] uppercase tracking-wide text-[#b4b4b4] mb-3">
        Previous explorations
      </div>
      <div className="space-y-2">
        {/* Newest first */}
        {[...sessions].reverse().map((session, i) => (
          <HistorySession
            key={session.rootQuestion + i}
            session={session}
            index={sessions.length - 1 - i}
          />
        ))}
      </div>
    </div>
  )
}
