import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'

/**
 * AnimatedSubmitButton
 * Handles seamless morphing between normal, spinner loading,
 * and self-drawing checkmark success states.
 */
export default function AnimatedSubmitButton({
  children,
  loading = false,
  success = false,
  disabled = false,
  className = '',
  onClick,
}) {
  return (
    <motion.button
      type="submit"
      disabled={disabled || loading || success}
      onClick={onClick}
      whileHover={loading || success || disabled ? {} : { scale: 1.01 }}
      whileTap={loading || success || disabled ? {} : { scale: 0.98 }}
      className={`relative flex h-12 w-full items-center justify-center overflow-hidden rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
        success
          ? 'bg-emerald-600 shadow-emerald-500/25'
          : 'gradient-button shadow-indigo-500/25'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'} ${className}`}
    >
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
            />
            <span>Signing in...</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 font-bold"
          >
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M 4 12 L 9 17 L 20 6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </svg>
            <span>Authenticated!</span>
          </motion.div>
        )}

        {!loading && !success && (
          <motion.div
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <span>{children}</span>
            <FiArrowRight size={16} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
