import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import ShimmerSkeleton from '../shared/ShimmerSkeleton'
import PerspectivePromptChips from './PerspectivePromptChips'
import { answerVariants } from '../../animations/variants'

// ─── Section metadata ─────────────────────────────────────────
const SECTION_META: Record<string, { label: string; color: string; border: string }> = {
  rootRisks:           { label: 'Risks',            color: 'text-red-400',    border: 'border-red-400/30' },
  rootAssumptions:     { label: 'Assumptions',       color: 'text-yellow-400', border: 'border-yellow-400/30' },
  rootImplications:    { label: 'Implications',      color: 'text-blue-400',   border: 'border-blue-400/30' },
  rootHiddenTradeoffs: { label: 'Hidden Trade-offs', color: 'text-purple-400', border: 'border-purple-400/30' },
}

function InsightDropdown({ items, sectionKey }: { items: string[]; sectionKey: string }) {
  const [open, setOpen] = useState(false)
  if (!items || items.length === 0) return null
  const { label, color, border } = SECTION_META[sectionKey]
  return (
    <div className={`rounded-lg border ${border} overflow-hidden`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors"
      >
        <span className={`text-xs font-semibold uppercase tracking-widest ${color}`}>{label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className={`w-3.5 h-3.5 ${color}`} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden px-3 pb-3 space-y-1.5"
          >
            {items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#b0b0b0] leading-relaxed">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${color} bg-current`} />
                {item}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AIAnswerCard() {
  const rootStatus = useExplorationStore((s) => s.rootStatus)
  const graph = useExplorationStore((s) => s.graph)
  const userQuestion = useExplorationStore((s) => s.userQuestion)

  // Nothing to show until exploration has started
  if (rootStatus === 'idle' || !graph) return null

  return (
    <>
      {/* User message bubble */}
      {userQuestion && (
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-3xl bg-[#303030] px-5 py-3 text-[15px] leading-relaxed">
            {userQuestion}
          </div>
        </div>
      )}

      {/* AI answer */}
      <div className="flex gap-4">
        <div className="w-8 h-8 rounded-full bg-[#10a37f] flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
          ✦
        </div>

        <div className="flex-1 space-y-4 text-[15px] leading-7 min-w-0">
          {/* Loading skeleton */}
          {rootStatus === 'loading' && <ShimmerSkeleton />}

          {/* Ready: answer text + chips */}
          <AnimatePresence>
            {rootStatus === 'ready' && (
              <motion.div
                variants={answerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                <p className="text-[15px] leading-7 text-[#ececec]">{graph.rootAnswer}</p>

                {/* Perspective insight dropdowns */}
                {(graph.rootRisks?.length > 0 ||
                  graph.rootAssumptions?.length > 0 ||
                  graph.rootImplications?.length > 0 ||
                  graph.rootHiddenTradeoffs?.length > 0) && (
                  <div className="space-y-2">
                    <InsightDropdown items={graph.rootRisks} sectionKey="rootRisks" />
                    <InsightDropdown items={graph.rootAssumptions} sectionKey="rootAssumptions" />
                    <InsightDropdown items={graph.rootImplications} sectionKey="rootImplications" />
                    <InsightDropdown items={graph.rootHiddenTradeoffs} sectionKey="rootHiddenTradeoffs" />
                  </div>
                )}

                {graph.rootPrompts && graph.rootPrompts.length > 0 && (
                  <PerspectivePromptChips
                    chips={graph.rootPrompts}
                    parentNodeId={null}
                    depth={0}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state */}
          {rootStatus === 'error' && (
            <p className="text-sm text-red-400">
              Something went wrong generating a response. Please try again.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
