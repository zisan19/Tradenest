import React, { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

/**
 * AnimatedCounter
 * Smoothly animates numbers counting up from 0 with eased timing
 * once scrolled into view (whileInView).
 */
export default function AnimatedCounter({
  value,
  duration = 1.8,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const shouldReduceMotion = useReducedMotion()

  // Parse numeric part and non-numeric suffixes (e.g. "15,000+" -> num: 15000, suf: "+")
  const rawString = String(value)
  const numericMatch = rawString.replace(/,/g, '').match(/\d+(\.\d+)?/)
  const targetNumber = numericMatch ? parseFloat(numericMatch[0]) : 0
  const autoSuffix = rawString.replace(/[\d,.\s]/g, '') || suffix

  const [displayNumber, setDisplayNumber] = useState(shouldReduceMotion ? targetNumber : 0)

  useEffect(() => {
    if (!isInView || shouldReduceMotion) {
      if (shouldReduceMotion) setDisplayNumber(targetNumber)
      return
    }

    let startTime = null
    let animationFrame

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) / (duration * 1000)
      const progress = Math.min(elapsed, 1)

      // Quintic easeOut curve for silky smooth landing
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const current = Math.floor(easeOut * targetNumber)

      setDisplayNumber(current)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayNumber(targetNumber)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, targetNumber, duration, shouldReduceMotion])

  return (
    <span ref={ref} className={`inline-block font-space font-bold ${className}`}>
      {prefix}
      {displayNumber.toLocaleString()}
      {autoSuffix}
    </span>
  )
}
