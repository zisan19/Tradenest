import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * StatusBadge — consistent colour-coded pill for order/product/user states.
 * Used by supplier orders, admin oversight and approval queues.
 */
const STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  'out of stock': 'bg-rose-50 text-rose-700 border-rose-200',
  'pending approval': 'bg-amber-50 text-amber-700 border-amber-200',
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  'changes pending approval': 'bg-amber-50 text-amber-700 border-amber-200',
}

const LABELS = {
  pending: 'Pending',
  draft: 'Draft',
  'changes pending approval': 'Changes pending approval',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  approved: 'Approved',
  rejected: 'Rejected',
  admin: 'Admin',
  supplier: 'Supplier',
  buyer: 'Retailer',
}

const DOT = {
  pending: 'bg-amber-500',
  draft: 'bg-slate-400',
  'changes pending approval': 'bg-amber-500',
  confirmed: 'bg-indigo-500',
  shipped: 'bg-cyan-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-rose-500',
  active: 'bg-emerald-500',
  inactive: 'bg-slate-400',
  suspended: 'bg-rose-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  admin: 'bg-violet-500',
  supplier: 'bg-indigo-500',
  buyer: 'bg-cyan-500',
}

export default function StatusBadge({ status, pulse = false, className = '' }) {
  const reduceMotion = useReducedMotion()
  const key = String(status || 'pending').toLowerCase()
  const style = STYLES[key] || 'bg-slate-100 text-slate-600 border-slate-200'
  const dot = DOT[key] || 'bg-slate-400'
  const label = LABELS[key] || String(status || '—').replace(/_/g, ' ')

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${style} ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && !reduceMotion && (
          <motion.span
            animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inline-flex h-full w-full rounded-full ${dot}`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
      </span>
      {label}
    </span>
  )
}
