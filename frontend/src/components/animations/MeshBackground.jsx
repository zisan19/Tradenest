import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * MeshBackground
 * Continuously animated gradient mesh with soft blurred blobs that slowly drift,
 * scale, and morph in an infinite loop.
 */
export default function MeshBackground({ children, className = '' }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background container with subtle grid */}
      <div className="hero-grid pointer-events-none absolute inset-0 z-0 opacity-40" />

      {/* Blob 1: Indigo / Violet drifting morph */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [0, 45, -30, 0],
                y: [0, -40, 25, 0],
                scale: [1, 1.18, 0.95, 1],
              }
        }
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-gradient-to-tr from-indigo-500/25 via-indigo-400/20 to-purple-600/25 blur-3xl filter will-change-transform"
      />

      {/* Blob 2: Cyan / Emerald floating blob */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [0, -50, 35, 0],
                y: [0, 40, -35, 0],
                scale: [1, 1.25, 0.92, 1],
              }
        }
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1.5,
        }}
        className="pointer-events-none absolute top-1/4 right-0 h-[30rem] w-[30rem] rounded-full bg-gradient-to-bl from-cyan-400/20 via-sky-300/15 to-indigo-500/15 blur-3xl filter will-change-transform"
      />

      {/* Blob 3: Violet / Rose soft bottom glow */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [0, 40, -45, 0],
                y: [0, -30, 40, 0],
                scale: [1, 1.15, 0.9, 1],
              }
        }
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
        className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-gradient-to-r from-violet-500/20 via-purple-400/15 to-pink-500/15 blur-3xl filter will-change-transform"
      />

      {/* Foreground Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
