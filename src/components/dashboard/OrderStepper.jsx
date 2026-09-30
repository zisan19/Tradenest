import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const STEPS = ['pending', 'confirmed', 'shipped', 'delivered']
const LABELS = { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' }

/**
 * OrderStepper — animated progress indicator for the forward-only order
 * pipeline (Pending -> Confirmed -> Shipped -> Delivered). Reused by the
 * supplier and admin order detail views for a consistent experience.
 */
export default function OrderStepper({ status }) {
  const reduceMotion = useReducedMotion()
  const currentIndex = STEPS.indexOf(String(status || 'pending').toLowerCase())
  const safeIndex = currentIndex < 0 ? 0 : currentIndex

  return (
    <div className="w-full">
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const done = i < safeIndex
          const active = i === safeIndex
          return (
            <div key={step} className={`flex ${i < STEPS.length - 1 ? 'flex-1' : ''} items-start`}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22, delay: i * 0.08 }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    done
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : active
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </motion.div>
                <span className={`mt-1.5 text-[11px] font-bold ${active ? 'text-indigo-700' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {LABELS[step]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="relative mx-1.5 mt-3.5 h-1 flex-1 rounded-full bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.45, delay: 0.15 + i * 0.1, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
