import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { PerspectiveNode } from '../../types'
import ThinkingIndicator from '../shared/ThinkingIndicator'
import { nodeRevealVariants } from '../../animations/variants'

interface Props {
  node: PerspectiveNode
}

const DEPTH_COLORS = [
  'bg-[#10a37f]',   // depth 1 — green
  'bg-indigo-400',  // depth 2 — indigo
  'bg-violet-400',  // depth 3 — violet
]

function SectionBlock({ label, items }: { label: string; items: string[] }) {
  const [open, setOpen] = useState(false)
  if (!items || items.length === 0) return null

  return (
    <div className="border-t border-white/10">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-[#b4b4b4] hover:text-white transition-colors uppercase tracking-wide"
        onClick={() => setOpen((p) => !p)}
      >
        {label}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            variants={nodeRevealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="px-4 pb-3 space-y-1.5 overflow-hidden"
          >
            {items.map((item, i) => (
              <li key={i} className="text-[13px] text-[#b4b4b4] leading-relaxed flex gap-2">
                <span className="text-white/20 shrink-0 mt-0.5">•</span>
                {item}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PerspectiveInsightCard({ node }: Props) {
  const dotColor = DEPTH_COLORS[Math.max(0, node.depth - 1)] ?? DEPTH_COLORS[2]

  // Custom branches use a dashed border to visually distinguish them
  const borderClass = node.isCustom
    ? 'border border-dashed border-violet-500/30 bg-violet-500/[0.03]'
    : 'border border-white/10 bg-white/[0.03]'

  return (
    <div className={`rounded-xl overflow-hidden ${borderClass}`}>
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-2">
        <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${dotColor}`} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[15px] leading-snug">{node.title || node.question}</div>
          <div className="text-xs text-[#b4b4b4] mt-0.5">Depth {node.depth}</div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        {node.status === 'loading' && (
          <ThinkingIndicator delayMs={node.depth * 200} />
        )}

        {node.status === 'error' && (
          <p className="text-sm text-red-400">Failed to load this perspective.</p>
        )}

        {node.status === 'ready' && (
          <p className="text-[14px] text-[#d1d1d1] leading-relaxed">{node.content}</p>
        )}
      </div>

      {/* Collapsible sections */}
      {node.status === 'ready' && (
        <>
          <SectionBlock label="Risks" items={node.risks} />
          <SectionBlock label="Assumptions" items={node.assumptions} />
          <SectionBlock label="Implications" items={node.implications} />
          <SectionBlock label="Hidden Tradeoffs" items={node.hiddenTradeoffs} />
        </>
      )}
    </div>
  )
}
