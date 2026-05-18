import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import { panelVariants } from '../../animations/variants'
import ExplorationBreadcrumbs from './ExplorationBreadcrumbs'
import CollapsibleReasoningTree from './CollapsibleReasoningTree'
import ExplorationHistory from './ExplorationHistory'
import BranchNavigator from '../navigation/BranchNavigator'
import ReturnToRootButton from '../navigation/ReturnToRootButton'

export default function ExplorationSidePanel() {
  const closeSidePanel = useExplorationStore((s) => s.closeSidePanel)
  const expandedBranchIds = useExplorationStore((s) => s.expandedBranchIds)
  const branchCount = expandedBranchIds.size

  return (
    <motion.aside
      className="w-[420px] shrink-0 h-full bg-[#1a1a2e] border-l border-white/10 flex flex-col overflow-hidden"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[15px]">Exploration</span>
          {branchCount > 0 && (
            <span className="text-xs bg-indigo-500/20 text-indigo-300 rounded-full px-2 py-0.5">
              {branchCount} {branchCount === 1 ? 'branch' : 'branches'}
            </span>
          )}
        </div>
        <button
          className="p-2 rounded-lg hover:bg-white/10 text-[#b4b4b4] hover:text-white transition-colors"
          onClick={closeSidePanel}
        >
          <X size={18} />
        </button>
      </div>

      {/* Breadcrumb trail */}
      <ExplorationBreadcrumbs />

      {/* Scrollable branch workspace */}
      <div className="flex-1 overflow-y-auto">
        <CollapsibleReasoningTree />
        <ExplorationHistory />
      </div>

      {/* Branch map toggle */}
      <BranchNavigator />

      {/* Return to root */}
      <ReturnToRootButton />
    </motion.aside>
  )
}
