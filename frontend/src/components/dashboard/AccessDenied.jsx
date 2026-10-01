import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ROLE_HOME, normalizeRole } from '../../auth/roles'
import { useAuth } from '../../context/AuthContext'

/**
 * AccessDenied — animated 403 screen for role-guarded dashboard routes.
 * Buyers hitting /supplier/* or /admin/* land here instead of the dashboard.
 */
export default function AccessDenied() {
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()
  const home = ROLE_HOME[normalizeRole(user?.role)] || '/'

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="card w-full max-w-md text-center"
      >
        <motion.div
          animate={reduceMotion ? {} : { rotate: [0, -6, 6, 0] }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 font-space text-2xl font-extrabold text-amber-600"
        >
          403
        </motion.div>
        <h1 className="mt-5 font-space text-2xl font-bold text-ink">Access denied</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your account doesn't have permission to open this dashboard. If you believe this is a mistake, contact the
          TradeNest administrators.
        </p>
        <Link
          to={home}
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-700"
        >
          Go to my workspace
        </Link>
      </motion.div>
    </div>
  )
}
