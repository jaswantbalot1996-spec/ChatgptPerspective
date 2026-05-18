import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import { returnButtonVariants } from '../../animations/variants'
import * as engine from '../../engine/perspectiveEngine'

export default function ReturnToRootButton() {
  const breadcrumbPath = useExplorationStore((s) => s.breadcrumbPath)

  return (
    <AnimatePresence>
      {breadcrumbPath.length > 0 && (
        <motion.div
          variants={returnButtonVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="px-4 py-3 border-t border-white/10 shrink-0"
        >
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/10 text-sm text-[#b4b4b4] hover:text-white transition-colors"
            onClick={() => engine.returnToRoot()}
          >
            <RotateCcw size={15} />
            Return to Root
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
