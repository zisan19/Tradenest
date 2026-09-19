import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../context/CartContext'

export default function FlyToCartAnimation() {
  const { flyingItems } = useCart()

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {flyingItems.map((item) => {
          const midX = (item.startX + item.targetX) / 2 + (item.targetX > item.startX ? 40 : -40)
          const midY = Math.min(item.startY, item.targetY) - 60

          return (
            <motion.div
              key={item.id}
              initial={{
                x: item.startX - 24,
                y: item.startY - 24,
                scale: 1,
                opacity: 0.95,
                rotate: 0,
              }}
              animate={{
                x: [item.startX - 24, midX, item.targetX - 16],
                y: [item.startY - 24, midY, item.targetY - 16],
                scale: [1, 1.15, 0.25],
                opacity: [1, 1, 0.2],
                rotate: [0, -15, 20],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 0.72,
                times: [0, 0.45, 1],
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute top-0 left-0 w-12 h-12 rounded-xl overflow-hidden shadow-2xl border-2 border-emerald-400 bg-white ring-4 ring-emerald-500/30 flex items-center justify-center pointer-events-none"
              style={{ willChange: 'transform, opacity' }}
            >
              <img
                src={item.imageUrl}
                alt="Flying product"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent mix-blend-overlay" />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
