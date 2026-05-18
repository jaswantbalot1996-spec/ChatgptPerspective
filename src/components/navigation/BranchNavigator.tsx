import { useState } from 'react'
import { GitBranch, Circle, CircleDot, Pen } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import * as engine from '../../engine/perspectiveEngine'

export default function BranchNavigator() {
  const [open, setOpen] = useState(false)
  const graph = useExplorationStore((s) => s.graph)
  const expandedBranchIds = useExplorationStore((s) => s.expandedBranchIds)

  const exploredNodes = Object.values(graph?.nodes ?? {})
    .filter((n) => n.status === 'ready')
    .sort((a, b) => a.depth - b.depth || a.createdAt - b.createdAt)

  const handleNodeClick = (nodeId: string, depth: number) => {
    if (depth === 1) {
      // L1: toggle — collapse if currently expanded, re-expand if collapsed
      if (expandedBranchIds.has(nodeId)) {
        engine.collapseBranch(nodeId)
      } else {
        // navigateToNode handles re-expanding a collapsed L1 branch
        engine.navigateToNode(nodeId)
      }
    } else {
      // L2/L3: always navigate (scrolls into focus within parent branch)
      engine.navigateToNode(nodeId)
    }
  }

  return (
    <div className="border-t border-white/10">
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#b4b4b4] hover:text-white transition-colors"
        onClick={() => setOpen((p) => !p)}
      >
        <GitBranch size={15} className="shrink-0" />
        <span>Branch Map</span>
        {exploredNodes.length > 0 && (
          <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-300 rounded-full px-2 py-0.5">
            {exploredNodes.length}
          </span>
        )}
      </button>

      {open && (
        <div className="pb-2 space-y-0.5">
          {exploredNodes.length === 0 && (
            <div className="px-4 py-2 text-sm text-[#b4b4b4]">No branches explored yet.</div>
          )}
          {exploredNodes.map((node) => {
            const isExpanded = expandedBranchIds.has(node.id)
            const indent = (node.depth - 1) * 12 + 16

            return (
              <button
                key={node.id}
                className="w-full text-left flex items-center gap-2 py-1.5 pr-4 rounded-lg hover:bg-white/5 text-sm transition-colors"
                style={{ paddingLeft: `${indent}px` }}
                onClick={() => handleNodeClick(node.id, node.depth)}
                title={node.depth === 1
                  ? (isExpanded ? 'Collapse this branch' : 'Re-expand this branch')
                  : 'Navigate to this node'
                }
              >
                {isExpanded
                  ? <CircleDot size={12} className="text-indigo-400 shrink-0" />
                  : <Circle size={12} className="text-white/30 shrink-0" />
                }
                <span className="truncate text-[#d1d1d1] flex-1">
                  {node.title || node.question.slice(0, 45)}
                </span>
                {node.isCustom && (
                  <Pen size={10} className="text-violet-400 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
