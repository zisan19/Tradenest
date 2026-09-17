import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'

/**
 * Toast
 * Spring-animated slide-in notification with an auto-dismiss shrinking progress bar
 * and self-drawing SVG checkmark for success feedback.
 */
export default function Toast({
  message,
  type = 'info',
  duration = 4500,
  onClose,
}) {
  const [visible, setVisible] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (message) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        if (onClose) onClose()
      }, duration)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [message, duration, onClose])

  if (!message) return null

  const isSuccess = type === 'success'
  const isError = type === 'error'

  const bgColor = isError
    ? 'bg-slate-900 border-red-500/50 text-white'
    : isSuccess
    ? 'bg-slate-900 border-emerald-500/50 text-white'
    : 'bg-slate-900 border-indigo-500/50 text-white'

  const progressColor = isError
    ? 'bg-red-500'
    : isSuccess
    ? 'bg-emerald-400'
    : 'bg-indigo-400'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.92 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className={`fixed bottom-6 right-6 z-50 flex min-w-[320px] max-w-md overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${bgColor}`}
        >
          <div className="flex w-full items-start gap-3">
            {/* Icon Column */}
            <div className="mt-0.5 shrink-0">
              {isSuccess ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <svg
                    className="h-4 w-4"
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
                      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                    />
                  </svg>
                </div>
              ) : isError ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                  <FiAlertCircle size={16} />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <FiInfo size={16} />
                </div>
              )}
            </div>

            {/* Message Column */}
            <div className="flex-1 pr-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isSuccess ? 'Success' : isError ? 'Attention' : 'Notice'}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-200">{message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setVisible(false)
                if (onClose) onClose()
              }}
              className="text-slate-400 hover:text-white transition"
              aria-label="Dismiss notification"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Shrinking Auto-dismiss Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{
                duration: shouldReduceMotion ? 0.01 : duration / 1000,
                ease: 'linear',
              }}
              className={`h-full ${progressColor}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
