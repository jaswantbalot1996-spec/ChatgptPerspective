import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useExplorationStore } from '../../store/explorationStore'
import RecursiveReasoningNode from './RecursiveReasoningNode'
import { nodeRevealVariants } from '../../animations/variants'

export default function CollapsibleReasoningTree() {
  const graph = useExplorationStore((s) => s.graph)
  const expandedBranchIds = useExplorationStore((s) => s.expandedBranchIds)

  // Preserve scroll position per branch — keyed by branch node ID
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollPositions = useRef<Record<string, number>>({})

  // Save scroll position whenever the element scrolls
  const handleScroll = (id: string) => {
    const el = scrollRefs.current[id]
    if (el) scrollPositions.current[id] = el.scrollTop
  }

  if (!graph) return null

  // Collect L1 branches that are currently expanded or loading, sorted oldest-first
  const l1Branches = [...expandedBranchIds]
    .map((id) => graph.nodes[id])
    .filter((n): n is NonNullable<typeof n> => !!n && n.depth === 1 && (n.isExpanded || n.status === 'loading'))
    .sort((a, b) => a.createdAt - b.createdAt)

  if (l1Branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
        <div className="text-3xl mb-3 opacity-30">✦</div>
        <div className="text-sm text-[#b4b4b4]">
          Click a perspective chip to begin exploring.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 py-4">
      <AnimatePresence initial={false}>
        {l1Branches.map((branch) => (
          <motion.div
            key={branch.id}
            variants={nodeRevealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            ref={(el) => {
              scrollRefs.current[branch.id] = el
              // Restore saved scroll position when branch re-mounts
              if (el && scrollPositions.current[branch.id] != null) {
                el.scrollTop = scrollPositions.current[branch.id]
              }
            }}
            onScroll={() => handleScroll(branch.id)}
            className="overflow-hidden"
          >
            <RecursiveReasoningNode nodeId={branch.id} depth={1} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
