import type { Variants } from 'framer-motion'

// ─── Panel ───────────────────────────────────────────────────
export const panelVariants: Variants = {
  hidden: { x: 420, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: {
    x: 420,
    opacity: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
}

// ─── Chip stagger container ───────────────────────────────────
export const chipContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
}

export const chipVariants: Variants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

// ─── Node reveal (height + fade) ─────────────────────────────
export const nodeRevealVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
}

// ─── Breadcrumb slide-in ──────────────────────────────────────
export const breadcrumbVariants: Variants = {
  hidden: { x: 20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

// ─── AI answer fade-up ────────────────────────────────────────
export const answerVariants: Variants = {
  hidden: { y: 8, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
}

// ─── Branch line draw ─────────────────────────────────────────
export const branchLineVariants: Variants = {
  hidden: { scaleY: 0, originY: 0 },
  visible: { scaleY: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}

// ─── Return-to-root fade ─────────────────────────────────────
export const returnButtonVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}
