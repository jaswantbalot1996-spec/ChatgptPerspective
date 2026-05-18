import { motion, AnimatePresence } from 'framer-motion'
import { useExplorationStore } from '../../store/explorationStore'
import { collapseBranch } from '../../engine/perspectiveEngine'
import PerspectiveInsightCard from './PerspectiveInsightCard'
import PerspectivePromptChips from '../chat/PerspectivePromptChips'
import { nodeRevealVariants, branchLineVariants } from '../../animations/variants'

interface Props {
  nodeId: string
  depth: number
}

export default function RecursiveReasoningNode({ nodeId, depth }: Props) {
  const graph = useExplorationStore((s) => s.graph)
  const node = graph?.nodes[nodeId]
  if (!node) return null

  // Depth 3 — compact terminal summary, no chips or children
  if (depth >= 3) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="text-sm font-medium text-[#d1d1d1]">
          {node.title || node.question}
        </div>
        <div className="text-xs text-[#b4b4b4] mt-1">Max depth reached</div>
      </div>
    )
  }

  // Find all expanded children of this node.
  // We look across the full graph (not just childPrompts) so that custom branches
  // created via createCustomBranch() — which have parentId === nodeId but whose
  // IDs are not listed in childPrompts — are also rendered.
  const expandedChildren = Object.values(graph?.nodes ?? {})
    .filter((n) => n.parentId === nodeId && n.isExpanded)
    .sort((a, b) => a.createdAt - b.createdAt)

  return (
    <div className="relative">
      {/* Branch connecting line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-px bg-indigo-500/20"
        variants={branchLineVariants}
        initial="hidden"
        animate="visible"
      />

      <div className="pl-4 space-y-3">
        {/* Collapse header for L1 branches */}
        {depth === 1 && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-[#b4b4b4] truncate pr-4">
              {node.question}
            </div>
            <button
              className="text-xs text-[#b4b4b4] hover:text-white shrink-0 transition-colors"
              onClick={() => collapseBranch(nodeId)}
            >
              Collapse
            </button>
          </div>
        )}

        <PerspectiveInsightCard node={node} />

        {node.status === 'ready' && (
          <PerspectivePromptChips
            chips={node.childPrompts}
            parentNodeId={nodeId}
            depth={depth}
          />
        )}

        {/* Recursively render expanded children */}
        <AnimatePresence>
          {expandedChildren.map((child) => (
            <motion.div
              key={child.id}
              variants={nodeRevealVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <RecursiveReasoningNode nodeId={child.id} depth={child.depth} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
