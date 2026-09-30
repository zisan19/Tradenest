import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

/**
 * StatCard — animated KPI card with icon, count-up value and optional
 * trend indicator (e.g. "+12.4% vs last week").
 */
export default function StatCard({
  label,
  value = 0,
  icon: Icon,
  prefix = '',
  suffix = '',
  decimals = 0,
  trend = null, // { value: 12.4, label: 'vs last week' }
  accent = 'indigo',
  index = 0,
}) {
  const reduceMotion = useReducedMotion()

  const accents = {
    indigo: { ring: 'border-indigo-100', icon: 'bg-indigo-50 text-indigo-600', glow: 'from-indigo-500/10' },
    emerald: { ring: 'border-emerald-100', icon: 'bg-emerald-50 text-emerald-600', glow: 'from-emerald-500/10' },
    cyan: { ring: 'border-cyan-100', icon: 'bg-cyan-50 text-cyan-600', glow: 'from-cyan-500/10' },
    amber: { ring: 'border-amber-100', icon: 'bg-amber-50 text-amber-600', glow: 'from-amber-500/10' },
    violet: { ring: 'border-violet-100', icon: 'bg-violet-50 text-violet-600', glow: 'from-violet-500/10' },
  }
  const a = accents[accent] || accents.indigo

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      className={`card relative overflow-hidden p-5 ${a.ring}`}
    >
      {/* soft radial glow */}
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${a.glow} to-transparent`} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${a.icon}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <div className="mt-3 font-space text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      {trend && typeof trend.value === 'number' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold">
          <span className={trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}%
          </span>
          {trend.label && <span className="font-medium text-slate-400">{trend.label}</span>}
        </div>
      )}
    </motion.div>
  )
}
