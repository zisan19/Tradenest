import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * PageTransition
 * Smooth fade + subtle vertical slide transition between routes using AnimatePresence.
 */
export default function PageTransition({ children }) {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      key={location.pathname}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full w-full will-change-[transform,opacity]"
    >
      {children}
    </motion.div>
  )
}
