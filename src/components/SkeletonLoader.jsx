import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export function ShimmerBox({ className = '' }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className={`relative overflow-hidden bg-slate-100/90 ${className}`}>
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: ['-100%', '100%'],
              }
        }
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />
    </div>
  )
}

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
      <ShimmerBox className="h-52 w-full rounded-xl sm:h-48" />
      <div className="space-y-3 px-1 pt-4">
        <ShimmerBox className="h-5 w-4/5 rounded-md" />
        <ShimmerBox className="h-4 w-full rounded-md" />
        <ShimmerBox className="h-4 w-3/5 rounded-md" />
        <div className="flex justify-between items-center pt-4">
          <ShimmerBox className="h-7 w-24 rounded-lg" />
          <ShimmerBox className="h-4 w-20 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export default function SkeletonLoader({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  )
}