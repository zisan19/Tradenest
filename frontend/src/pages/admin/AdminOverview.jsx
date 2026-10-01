import React, { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  FiActivity, FiAlertCircle, FiBox, FiDollarSign, FiRefreshCw, FiShoppingBag,
  FiUserPlus, FiUsers,
} from 'react-icons/fi'
import api from '../../api/axios'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { ChartCard, TrendLine, BarsChart } from '../../components/dashboard/Chart'
import { extractError } from '../../components/dashboard/api'

/**
 * Admin Overview tab — platform-wide KPIs, revenue/order trend, signup
 * growth and a live activity feed, all from GET /api/admin/dashboard/stats.
 */
export default function AdminOverview({ pendingCounts }) {
  const reduceMotion = useReducedMotion()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/api/admin/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(extractError(err, 'Could not load platform stats')))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="card h-32 p-5">
            <div className="shimmer h-4 w-24 rounded" />
            <div className="shimmer mt-4 h-8 w-28 rounded-lg" />
          </div>
        ))}
        <div className="card col-span-full h-72 p-6">
          <div className="shimmer h-5 w-40 rounded" />
          <div className="shimmer mt-6 h-44 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card flex flex-col items-center py-14 text-center">
        <FiAlertCircle className="text-rose-500" size={28} />
        <p className="mt-3 font-space text-lg font-bold text-ink">Couldn't load platform stats</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"><FiRefreshCw size={14} /> Try again</button>
      </div>
    )
  }

  const trendLabels = (stats.revenue_trend || []).map((p) => p.label)
  const revenueData = (stats.revenue_trend || []).map((p) => p.revenue)
  const ordersData = (stats.revenue_trend || []).map((p) => p.orders)
  const signupLabels = (stats.signup_trend || []).map((p) => p.label)
  const signupData = (stats.signup_trend || []).map((p) => p.signups)

  const activity = [
    ...(stats.recent_orders || []).map((o) => ({
      id: `order-${o.id}`,
      icon: <FiShoppingBag size={13} className="text-cyan-600" />,
      bg: 'bg-cyan-50',
      text: `Order #${o.id} placed by ${o.buyer_name || 'a retailer'} · $${Number(o.total).toFixed(2)}`,
      time: o.created_at,
    })),
    ...(stats.recent_signups || []).map((u) => ({
      id: `user-${u.id}`,
      icon: <FiUserPlus size={13} className="text-indigo-600" />,
      bg: 'bg-indigo-50',
      text: `${u.full_name || u.email} registered as ${u.role}`,
      time: u.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 8)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard index={0} label="Total Users" value={stats.total_users ?? 0} icon={FiUsers} accent="indigo" />
        <StatCard index={1} label="Suppliers" value={stats.total_suppliers ?? 0} icon={FiBox} accent="violet" />
        <StatCard index={2} label="Products" value={stats.total_products ?? 0} icon={FiBox} accent="cyan" />
        <StatCard index={3} label="Orders" value={stats.total_orders ?? 0} icon={FiShoppingBag} accent="emerald" />
        <StatCard index={4} label="Platform Revenue" value={stats.total_revenue ?? 0} prefix="$" icon={FiDollarSign} accent="amber" />
      </div>

      {/* Pending review alert banner */}
      {(pendingCounts?.suppliers > 0 || pendingCounts?.products > 0) && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col items-start justify-between gap-3 border-amber-100 bg-amber-50/60 sm:flex-row sm:items-center"
        >
          <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <FiAlertCircle /> {pendingCounts?.suppliers ?? 0} supplier(s) and {pendingCounts?.products ?? 0} product(s) awaiting review
          </p>
          <a href="/admin/approvals" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:bg-amber-600">Review now</a>
        </motion.div>
      )}

      {/* Trends */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard title="Revenue & orders — last 14 days" subtitle="Platform-wide order volume and value">
          <TrendLine labels={trendLabels} data={revenueData} />
        </ChartCard>
        <ChartCard title="User growth — new signups" subtitle="Daily registrations across all roles">
          <BarsChart labels={signupLabels} data={signupData} label="Signups" color="#8b5cf6" prefix="" />
        </ChartCard>
      </div>

      {/* Recent activity feed */}
      <div className="card p-0">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-space text-lg font-bold text-ink">Recent activity</h2>
          <p className="mt-0.5 text-xs text-slate-500">Latest orders and registrations across the platform</p>
        </div>
        <ul className="divide-y divide-slate-50">
          {activity.map((item, i) => (
            <motion.li
              key={item.id}
              initial={reduceMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>{item.icon}</span>
              <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.text}</p>
              <span className="shrink-0 text-xs text-slate-400">{new Date(item.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </motion.li>
          ))}
          {activity.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-400">No activity yet.</li>}
        </ul>
      </div>
    </div>
  )
}
