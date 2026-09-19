import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/**
 * DrawingPath
 * Self-drawing SVG path line tied to scroll progress using useScroll and useTransform.
 */
export default function DrawingPath({ className = '' }) {
  const containerRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  const pathLength = useTransform(scrollYProgress, [0, 0.9], [0, 1])

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 900 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        {/* Background faint guide track */}
        <path
          d="M 50 60 C 250 10, 350 110, 500 60 C 650 10, 750 110, 850 60"
          stroke="rgba(226, 232, 240, 0.6)"
          strokeWidth="3"
          strokeDasharray="6 6"
        />

        {/* Animated drawing foreground path */}
        <motion.path
          d="M 50 60 C 250 10, 350 110, 500 60 C 650 10, 750 110, 850 60"
          stroke="url(#gradient-line)"
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{
            pathLength: shouldReduceMotion ? 1 : pathLength,
          }}
        />

        <defs>
          <linearGradient id="gradient-line" x1="0" y1="0" x2="900" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4F46E5" />
            <stop offset="0.5" stopColor="#06B6D4" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
