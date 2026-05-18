import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { PromptChip } from '../../types'
import { useExplorationStore } from '../../store/explorationStore'
import * as engine from '../../engine/perspectiveEngine'
import { chipContainerVariants, chipVariants } from '../../animations/variants'

interface Props {
  chips: PromptChip[]
  parentNodeId: string | null
  depth: number
}

export default function PerspectivePromptChips({ chips, parentNodeId, depth }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState('')
  const graph = useExplorationStore((s) => s.graph)

  if (depth >= 3) return null
  if (!chips || chips.length === 0) return null

  const handleCustomSubmit = () => {
    const text = customText.trim()
    if (!text) return
    engine.createCustomBranch(text, parentNodeId)
    setCustomText('')
    setShowCustom(false)
  }

  return (
    <div className="pt-3">
      <div className="text-xs uppercase tracking-wide text-[#b4b4b4] mb-3">
        Explore what may be missing
      </div>

      <motion.div
        className="flex flex-wrap gap-2"
        variants={chipContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {chips.map((chip) => {
          const nodeInGraph = graph?.nodes[chip.id]
          const isExplored = nodeInGraph?.status === 'ready'
          const isLoading = nodeInGraph?.status === 'loading'

          return (
            <motion.button
              key={chip.id}
              variants={chipVariants}
              onClick={() => engine.expandBranch(chip.id, parentNodeId)}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl border text-sm text-left transition disabled:opacity-60"
              style={{
                borderColor: `rgba(99, 102, 241, ${0.1 + chip.heatScore * 0.5})`,
                backgroundColor: isExplored
                  ? 'rgba(99, 102, 241, 0.1)'
                  : 'rgba(255,255,255,0.03)',
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: `0 0 12px rgba(99, 102, 241, ${0.15 + chip.heatScore * 0.25})`,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {isExplored && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5 mb-0.5 align-middle" />
              )}
              {chip.label}
            </motion.button>
          )
        })}

        {!showCustom && (
          <motion.button
            variants={chipVariants}
            onClick={() => setShowCustom(true)}
            className="px-3 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/10 text-sm text-[#b4b4b4] transition flex items-center gap-1.5"
          >
            <Plus size={14} />
            Ask your own
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {showCustom && (
          <motion.div
            className="mt-2 flex gap-2 overflow-hidden"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <input
              autoFocus
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCustomSubmit()
                if (e.key === 'Escape') setShowCustom(false)
              }}
              placeholder="Ask your own question..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500/50 text-white placeholder:text-[#b4b4b4] min-w-0"
            />
            <button
              onClick={handleCustomSubmit}
              className="shrink-0 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition"
            >
              Ask
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
