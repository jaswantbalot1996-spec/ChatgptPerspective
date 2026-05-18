import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import * as engine from '../../engine/perspectiveEngine'
import { breadcrumbVariants } from '../../animations/variants'

export default function ExplorationBreadcrumbs() {
  const graph = useExplorationStore((s) => s.graph)
  const breadcrumbPath = useExplorationStore((s) => s.breadcrumbPath)

  if (breadcrumbPath.length === 0) return null

  const nodes = breadcrumbPath
    .map((id) => graph?.nodes[id] ?? null)
    .filter(Boolean)

  return (
    <nav className="flex items-center gap-1 flex-wrap px-4 py-2.5 border-b border-white/10 text-sm">
      <button
        className="text-[#b4b4b4] hover:text-white transition-colors shrink-0"
        onClick={() => engine.returnToRoot()}
      >
        Root
      </button>

      <AnimatePresence initial={false}>
        {nodes.map((node) => (
          <motion.span
            key={node!.id}
            className="flex items-center gap-1"
            variants={breadcrumbVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <ChevronRight size={14} className="text-white/30 shrink-0" />
            <button
              className="text-[#b4b4b4] hover:text-white transition-colors truncate max-w-[130px]"
              onClick={() => engine.navigateToNode(node!.id)}
              title={node!.title || node!.question}
            >
              {node!.title || node!.question.slice(0, 28)}
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
    </nav>
  )
}
