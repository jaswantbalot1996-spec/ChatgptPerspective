import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Plus } from 'lucide-react'
import { useExplorationStore } from '../../store/explorationStore'
import * as engine from '../../engine/perspectiveEngine'

export default function PromptInputBar() {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const rootStatus = useExplorationStore((s) => s.rootStatus)
  const setUserQuestion = useExplorationStore((s) => s.setUserQuestion)
  const isLoading = rootStatus === 'loading'

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    setUserQuestion(trimmed)
    engine.startExploration(trimmed)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="px-6 pb-6 shrink-0">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="rounded-3xl bg-[#303030] border border-white/10 px-4 py-3 flex items-end gap-3 shadow-xl"
          whileFocus={{ scale: 1.01 }}
        >
          <button className="p-2 rounded-full hover:bg-white/10 shrink-0" disabled={isLoading}>
            <Plus size={20} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatGPT"
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none text-[15px] placeholder:text-[#b4b4b4] max-h-40 disabled:opacity-60"
          />

          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#d9d9d9] disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition-opacity"
          >
            <Send size={17} />
          </button>
        </motion.div>

        <div className="text-center text-xs text-[#b4b4b4] mt-2">
          ChatGPT can make mistakes. Check important info.
        </div>
      </div>
    </div>
  )
}
