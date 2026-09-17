import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * AnimatedInput
 * Input field with a floating label animation on focus/value,
 * and a smoothly expanding animated glow focus ring.
 */
export default function AnimatedInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  className = '',
  error = false,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const isFloating = isFocused || (value !== undefined && String(value).length > 0)

  return (
    <div className={`relative ${className}`}>
      {/* Expanding Animated Glow Focus Ring */}
      <motion.div
        animate={
          isFocused
            ? { scale: 1, opacity: 1 }
            : { scale: 0.98, opacity: 0 }
        }
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`pointer-events-none absolute -inset-1 rounded-2xl ${
          error
            ? 'bg-red-500/20 blur-[3px]'
            : 'bg-indigo-500/20 blur-[4px]'
        }`}
      />

      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className={`peer w-full rounded-xl border bg-white/90 px-4 pt-5 pb-2 text-sm text-slate-900 outline-none backdrop-blur-sm transition-colors ${
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-slate-200/90 focus:border-indigo-500'
          }`}
          placeholder={isFocused ? placeholder : ''}
          {...props}
        />

        {/* Floating Label */}
        <motion.label
          htmlFor={id}
          animate={
            shouldReduceMotion
              ? {}
              : isFloating
              ? { y: -10, scale: 0.78, color: error ? '#ef4444' : '#4f46e5' }
              : { y: 0, scale: 1, color: '#64748b' }
          }
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="pointer-events-none absolute left-4 top-3.5 origin-[0_0] text-sm font-medium text-slate-500 select-none"
        >
          {label}
        </motion.label>
      </div>
    </div>
  )
}
