import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * FloatingBadge
 * Gently bobs up and down independently with offset timing, giving elements a living feel.
 */
export default function FloatingBadge({
  children,
  className = '',
  offset = 6,
  duration = 4,
  delay = 0,
  dotColor = 'bg-emerald-400',
  showDot = true,
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={
        shouldReduceMotion
          ? { opacity: 1, scale: 1 }
          : {
              opacity: 1,
              scale: 1,
              y: [-offset, offset, -offset],
            }
      }
      transition={{
        y: {
          duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        },
        opacity: { duration: 0.5, delay: delay * 0.5 },
        scale: { duration: 0.5, delay: delay * 0.5 },
      }}
      className={`inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-lg shadow-indigo-900/5 backdrop-blur-md will-change-transform ${className}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2">
          <motion.span
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: [1, 1.9, 1],
                    opacity: [0.75, 0, 0.75],
                  }
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`} />
        </span>
      )}
      {children}
    </motion.div>
  )
}
