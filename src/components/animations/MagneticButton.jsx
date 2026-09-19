import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

/**
 * MagneticButton
 * Creates a premium magnetic pull effect towards the cursor with spring physics,
 * plus a dynamic ripple wave effect on click.
 */
export default function MagneticButton({
  children,
  className = '',
  onClick,
  pullStrength = 0.28,
  springConfig = { damping: 15, stiffness: 180, mass: 0.1 },
  as: Component = 'button',
  ...props
}) {
  const ref = useRef(null)
  const shouldReduceMotion = useReducedMotion()
  const [ripples, setRipples] = useState([])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, springConfig)
  const springY = useSpring(mouseY, springConfig)

  const handleMouseMove = (e) => {
    if (shouldReduceMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = (e.clientX - centerX) * pullStrength
    const distanceY = (e.clientY - centerY) * pullStrength

    mouseX.set(distanceX)
    mouseY.set(distanceY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleClick = (e) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const rippleX = e.clientX - rect.left
      const rippleY = e.clientY - rect.top
      const newRipple = { id: Date.now() + Math.random(), x: rippleX, y: rippleY }
      setRipples((prev) => [...prev.slice(-3), newRipple])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
      }, 700)
    }
    if (onClick) onClick(e)
  }

  return (
    <motion.div
      ref={ref}
      style={{
        x: shouldReduceMotion ? 0 : springX,
        y: shouldReduceMotion ? 0 : springY,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block relative"
    >
      <Component
        onClick={handleClick}
        className={`relative overflow-hidden cursor-pointer select-none active:scale-[0.98] transition-transform ${className}`}
        {...props}
      >
        {children}

        {/* Dynamic Click Ripple */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.45 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            style={{
              top: ripple.y,
              left: ripple.x,
              transform: 'translate(-50%, -50%)',
            }}
            className="pointer-events-none absolute h-24 w-24 rounded-full bg-white/40 -translate-x-1/2 -translate-y-1/2"
          />
        ))}
      </Component>
    </motion.div>
  )
}
