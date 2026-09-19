import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import MagneticButton from './MagneticButton'

/**
 * GradientBorderButton
 * Continuously animating shimmering gradient border with a rotating conic-gradient glow,
 * paired with a magnetic pull effect on hover and click ripple.
 */
export default function GradientBorderButton({
  children,
  className = '',
  onClick,
  href,
  as = 'button',
  ...props
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <MagneticButton pullStrength={0.22}>
      <div className="relative group p-[2px] rounded-2xl overflow-hidden inline-flex items-center justify-center">
        {/* Continuous rotating conic gradient border */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  rotate: [0, 360],
                }
          }
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,#4F46E5,#06B6D4,#7C3AED,#EC4899,#4F46E5)] opacity-80 group-hover:opacity-100 transition-opacity blur-[1px]"
        />

        {/* Ambient soft bloom behind button */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-20 group-hover:opacity-40 blur-md transition-opacity" />

        {/* Inner button surface */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`relative z-10 flex items-center justify-center gap-2 rounded-[14px] bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all group-hover:bg-slate-800 ${className}`}
        >
          {as === 'a' && href ? (
            <a href={href} onClick={onClick} className="inline-flex items-center gap-2" {...props}>
              {children}
            </a>
          ) : (
            <button type="button" onClick={onClick} className="inline-flex items-center gap-2" {...props}>
              {children}
            </button>
          )}
        </motion.div>
      </div>
    </MagneticButton>
  )
}
