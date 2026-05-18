import { motion } from 'framer-motion'

interface Props {
  delayMs?: number
}

const dotVariant = {
  idle: { scaleY: 0.4, opacity: 0.4 },
  pulse: { scaleY: 1.0, opacity: 1.0 },
}

export default function ThinkingIndicator({ delayMs = 0 }: Props) {
  return (
    <div className="flex items-center gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-4 rounded-full bg-indigo-400"
          variants={dotVariant}
          initial="idle"
          animate="pulse"
          transition={{
            repeat: Infinity,
            repeatType: 'reverse',
            duration: 0.5,
            delay: delayMs / 1000 + i * 0.15,
          }}
        />
      ))}
    </div>
  )
}
