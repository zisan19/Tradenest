import React, { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const COLORS = [
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EC4899', // pink
  '#14B8A6', // teal
]

export default function ConfettiBurst() {
  const shouldReduceMotion = useReducedMotion()

  const particles = useMemo(() => {
    if (shouldReduceMotion) return []
    return Array.from({ length: 48 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 48 + (Math.random() * 0.3 - 0.15)
      const distance = 90 + Math.random() * 220
      const color = COLORS[i % COLORS.length]
      const size = 6 + Math.random() * 8
      const isRect = Math.random() > 0.4
      const duration = 1.2 + Math.random() * 0.8

      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 80, // bias upward
        color,
        size,
        isRect,
        duration,
        rotation: Math.random() * 720 - 360,
      }
    })
  }, [shouldReduceMotion])

  if (shouldReduceMotion) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: p.x,
            y: p.y + 120, // gravity fall
            scale: [0, 1.2, 0.9, 0],
            opacity: [1, 1, 0.8, 0],
            rotate: p.rotation,
          }}
          transition={{
            duration: p.duration,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.isRect ? p.size * 2 : p.size,
            borderRadius: p.isRect ? '2px' : '50%',
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  )
}
