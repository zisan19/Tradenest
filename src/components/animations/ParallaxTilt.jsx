import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

/**
 * ParallaxTilt
 * Live 3D card tilt reacting in real-time to mouse movements,
 * combined with a gentle continuous float loop.
 */
export default function ParallaxTilt({
  children,
  className = '',
  maxTilt = 12,
  floatAmplitude = 8,
  floatDuration = 5,
}) {
  const ref = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Smooth out mouse tracking with springs
  const mouseXSpring = useSpring(x, { damping: 20, stiffness: 160 })
  const mouseYSpring = useSpring(y, { damping: 20, stiffness: 160 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxTilt, -maxTilt])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxTilt, maxTilt])

  const handleMouseMove = (e) => {
    if (shouldReduceMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={
        shouldReduceMotion
          ? {}
          : {
              y: [-floatAmplitude, floatAmplitude, -floatAmplitude],
            }
      }
      transition={{
        duration: floatDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        perspective: 1000,
      }}
      className={`relative will-change-transform ${className}`}
    >
      <motion.div
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
