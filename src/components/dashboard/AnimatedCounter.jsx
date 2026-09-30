import React, { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * AnimatedCounter — count-up number animation.
 * Eases towards the target value with rAF; respects prefers-reduced-motion.
 * Formats with locale separators and optional decimals.
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1100,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) {
  const [display, setDisplay] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const to = Number(value) || 0
    if (reduceMotion) {
      setDisplay(to)
      return undefined
    }
    let start = null
    let frameId
    const step = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(to * eased)
      if (progress < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration, reduceMotion])

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
