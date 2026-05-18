import { motion, AnimatePresence } from 'framer-motion'
import { useExplorationStore } from '../../store/explorationStore'
import ShimmerSkeleton from '../shared/ShimmerSkeleton'
import PerspectivePromptChips from './PerspectivePromptChips'
import { answerVariants } from '../../animations/variants'

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
