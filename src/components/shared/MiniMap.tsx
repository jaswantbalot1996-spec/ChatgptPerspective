import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, X } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import type { PerspectiveNode } from '../../types'

// ─── SVG canvas dimensions ───────────────────────────────────
const W = 196
const H = 148
const NODE_R = 4

// Y position per depth row
const DEPTH_Y: Record<number, number> = { 0: 18, 1: 54, 2: 94, 3: 130 }

// ─── Types ───────────────────────────────────────────────────
interface LayoutNode {
  id: string
  x: number
  y: number
  depth: number
  isActive: boolean
  isExpanded: boolean
  isCustom: boolean
  status: string
}

interface Edge {
  x1: number
  y1: number
  x2: number
  y2: number
  isActive: boolean
}

// ─── Layout helpers ──────────────────────────────────────────
function spreadX(index: number, total: number, centerX: number, maxSpread: number): number {
  if (total === 1) return centerX
  const step = Math.min(maxSpread / (total - 1), 36)
  const totalWidth = step * (total - 1)
  return centerX - totalWidth / 2 + index * step
}

function buildLayout(
  nodes: PerspectiveNode[],
  breadcrumbPath: string[],
  expandedBranchIds: Set<string>,
) {
  const posMap: Record<string, { x: number; y: number }> = {}
  posMap['__root__'] = { x: W / 2, y: DEPTH_Y[0] }

  // Group by depth, sort by createdAt
  const byDepth: Record<number, PerspectiveNode[]> = { 1: [], 2: [], 3: [] }
  nodes.forEach((n) => {
    if (byDepth[n.depth]) byDepth[n.depth].push(n)
  })
  Object.values(byDepth).forEach((arr) => arr.sort((a, b) => a.createdAt - b.createdAt))

  // L1 — spread evenly across full canvas width
  const l1 = byDepth[1]
  l1.forEach((n, i) => {
    posMap[n.id] = { x: spreadX(i, l1.length, W / 2, W - 40), y: DEPTH_Y[1] }
  })

  // L2 — cluster under each L1 parent
  const l2ByParent: Record<string, PerspectiveNode[]> = {}
  byDepth[2].forEach((n) => {
    if (n.parentId) {
      if (!l2ByParent[n.parentId]) l2ByParent[n.parentId] = []
      l2ByParent[n.parentId].push(n)
    }
  })
  l1.forEach((parent) => {
    const children = l2ByParent[parent.id] ?? []
    const px = posMap[parent.id]?.x ?? W / 2
    children.forEach((child, i) => {
      posMap[child.id] = { x: spreadX(i, children.length, px, 56), y: DEPTH_Y[2] }
    })
  })

  // L3 — cluster under each L2 parent
  const l3ByParent: Record<string, PerspectiveNode[]> = {}
  byDepth[3].forEach((n) => {
    if (n.parentId) {
      if (!l3ByParent[n.parentId]) l3ByParent[n.parentId] = []
      l3ByParent[n.parentId].push(n)
    }
  })
  byDepth[2].forEach((parent) => {
    const children = l3ByParent[parent.id] ?? []
    const px = posMap[parent.id]?.x ?? W / 2
    children.forEach((child, i) => {
      posMap[child.id] = { x: spreadX(i, children.length, px, 32), y: DEPTH_Y[3] }
    })
  })

  // Build layout nodes
  const activeSet = new Set(breadcrumbPath)
  const layoutNodes: LayoutNode[] = nodes.map((n) => ({
    id: n.id,
    x: posMap[n.id]?.x ?? W / 2,
    y: posMap[n.id]?.y ?? DEPTH_Y[n.depth] ?? 18,
    depth: n.depth,
    isActive: activeSet.has(n.id),
    isExpanded: expandedBranchIds.has(n.id),
    isCustom: n.isCustom,
    status: n.status,
  }))

  // Build edges
  const edges: Edge[] = nodes.map((n) => {
    const childPos = posMap[n.id]
    const parentPos = n.parentId ? posMap[n.parentId] : posMap['__root__']
    if (!childPos || !parentPos) return null
    return {
      x1: parentPos.x,
      y1: parentPos.y,
      x2: childPos.x,
      y2: childPos.y,
      isActive: activeSet.has(n.id) && (n.parentId ? activeSet.has(n.parentId) : true),
    }
  }).filter((e): e is Edge => e !== null)

  return { layoutNodes, edges }
}

// ─── Node fill color ─────────────────────────────────────────
function nodeColor(n: LayoutNode): string {
  if (n.isActive) return '#6366f1'
  if (n.status === 'loading') return 'rgba(251, 191, 36, 0.85)'
  if (n.isExpanded) return 'rgba(99, 102, 241, 0.55)'
  if (n.isCustom) return 'rgba(124, 58, 237, 0.75)'
  if (n.status === 'ready') return 'rgba(255, 255, 255, 0.3)'
  return 'rgba(255, 255, 255, 0.12)'
}

// ─── Component ───────────────────────────────────────────────
export default function MiniMap() {
  const [open, setOpen] = useState(false)
  const graph = useExplorationStore((s) => s.graph)
  const breadcrumbPath = useExplorationStore((s) => s.breadcrumbPath)
  const expandedBranchIds = useExplorationStore((s) => s.expandedBranchIds)
  const sidePanelOpen = useExplorationStore((s) => s.sidePanelOpen)

  const { layoutNodes, edges } = useMemo(() => {
    if (!graph) return { layoutNodes: [], edges: [] as Edge[] }
    return buildLayout(Object.values(graph.nodes), breadcrumbPath, expandedBranchIds)
  }, [graph, breadcrumbPath, expandedBranchIds])

  // Don't show toggle until a question has been asked
  if (!graph) return null

  const hasNodes = layoutNodes.length > 0
  const rightClass = sidePanelOpen ? 'right-[438px]' : 'right-6'

  return (
    <div className={`fixed bottom-6 z-50 flex flex-col items-end gap-2 transition-all duration-300 ${rightClass}`}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="glass rounded-2xl overflow-hidden"
            style={{ width: W + 24 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <span className="text-[10px] uppercase tracking-widest text-[#b4b4b4]">
                Reasoning Map
              </span>
              <span className="text-[10px] text-[#b4b4b4]">
                {layoutNodes.length} node{layoutNodes.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* SVG canvas */}
            <div className="px-3 pb-1">
              <svg width={W} height={H} className="block overflow-visible">
                {/* Depth row guides */}
                {[1, 2, 3].map((d) => (
                  <line
                    key={d}
                    x1={0}
                    y1={DEPTH_Y[d]}
                    x2={W}
                    y2={DEPTH_Y[d]}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={1}
                    strokeDasharray="3 4"
                  />
                ))}

                {/* Depth labels */}
                {[
                  { d: 0, label: 'Root' },
                  { d: 1, label: 'L1' },
                  { d: 2, label: 'L2' },
                  { d: 3, label: 'L3' },
                ].map(({ d, label }) => (
                  <text
                    key={d}
                    x={4}
                    y={DEPTH_Y[d] - 4}
                    fill="rgba(255,255,255,0.18)"
                    fontSize={8}
                    fontFamily="sans-serif"
                  >
                    {label}
                  </text>
                ))}

                {/* Edges */}
                {edges.map((e, i) => (
                  <line
                    key={i}
                    x1={e.x1}
                    y1={e.y1}
                    x2={e.x2}
                    y2={e.y2}
                    stroke={
                      e.isActive ? 'rgba(99,102,241,0.65)' : 'rgba(255,255,255,0.1)'
                    }
                    strokeWidth={e.isActive ? 1.5 : 1}
                  />
                ))}

                {/* Root node */}
                <circle
                  cx={W / 2}
                  cy={DEPTH_Y[0]}
                  r={NODE_R}
                  fill="#10a37f"
                />

                {/* Branch nodes */}
                {layoutNodes.map((n) => (
                  <circle
                    key={n.id}
                    cx={n.x}
                    cy={n.y}
                    r={NODE_R}
                    fill={nodeColor(n)}
                    stroke={n.isActive ? 'rgba(99,102,241,0.5)' : 'transparent'}
                    strokeWidth={2}
                  />
                ))}

                {/* Empty state hint */}
                {!hasNodes && (
                  <text
                    x={W / 2}
                    y={H / 2 + 16}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.2)"
                    fontSize={10}
                    fontFamily="sans-serif"
                  >
                    Click a chip to branch
                  </text>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pb-3">
              {[
                { color: '#10a37f', label: 'Root' },
                { color: '#6366f1', label: 'Active' },
                { color: 'rgba(99,102,241,0.55)', label: 'Open' },
                { color: 'rgba(124,58,237,0.75)', label: 'Custom' },
                { color: 'rgba(255,255,255,0.3)', label: 'Explored' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-[9px] text-[#b4b4b4]">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-[#1a1a2e] border border-white/15 flex items-center justify-center text-[#b4b4b4] hover:text-indigo-300 hover:border-indigo-500/50 shadow-lg transition"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={open ? 'Close reasoning map' : 'Open reasoning map'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              <X size={15} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              <GitBranch size={15} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
