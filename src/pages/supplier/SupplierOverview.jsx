import React, { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiAlertCircle, FiArrowUpRight, FiClock, FiDollarSign, FiPackage, FiRefreshCw, FiShoppingBag, FiTrendingUp } from 'react-icons/fi'
import api from '../../api/axios'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { ChartCard, TrendLine } from '../../components/dashboard/Chart'
import { extractError } from '../../components/dashboard/api'

/**
 * Supplier Overview tab — KPI cards, revenue trend chart (live data from
 * /api/supplier/dashboard/stats) and the latest incoming orders.
 */
export default function SupplierOverview({ onOpenOrder }) {
  const reduceMotion = useReducedMotion()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get('/api/supplier/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(extractError(err, 'Could not load dashboard stats')))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card h-32 p-5">
            <div className="shimmer h-4 w-24 rounded" />
            <div className="shimmer mt-4 h-8 w-32 rounded-lg" />
          </div>
        ))}
        <div className="card col-span-full h-72 p-6">
          <div className="shimmer h-5 w-40 rounded" />
          <div className="shimmer mt-6 h-44 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card flex flex-col items-center py-14 text-center">
        <FiAlertCircle className="text-rose-500" size={28} />
        <p className="mt-3 font-space text-lg font-bold text-ink">Couldn't load your dashboard</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700">
          <FiRefreshCw size={14} /> Try again
        </button>
      </div>
    )
  }

  const trendLabels = (stats.revenue_trend || []).map((p) => p.label)
  const trendData = (stats.revenue_trend || []).map((p) => p.revenue)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Total Revenue" value={stats.total_revenue ?? 0} prefix="$" decimals={0} icon={FiDollarSign} accent="indigo"
          trend={stats.revenue_change_pct != null ? { value: stats.revenue_change_pct, label: 'vs last week' } : null} />
        <StatCard index={1} label="Total Orders" value={stats.total_orders ?? 0} icon={FiShoppingBag} accent="cyan" />
        <StatCard index={2} label="Units Sold" value={stats.total_units_sold ?? 0} icon={FiPackage} accent="emerald" />
        <StatCard index={3} label="Pending Orders" value={stats.pending_orders ?? 0} icon={FiClock} accent="amber" />
      </div>

      {/* Revenue trend */}
      <ChartCard title="Revenue — last 14 days" subtitle="Paid + pending order value across your listings">
        <TrendLine labels={trendLabels} data={trendData} />
      </ChartCard>

      {/* Recent orders */}
      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h2 className="font-space text-lg font-bold text-ink">Recent orders</h2>
            <p className="mt-0.5 text-xs text-slate-500">Latest incoming orders containing your products</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            <FiTrendingUp size={12} /> Live
          </span>
        </div>
        {(stats.recent_orders || []).length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-space text-base font-bold text-ink">No orders yet</p>
            <p className="mt-1 text-sm text-slate-500">When buyers order your products, they'll show up here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {stats.recent_orders.map((order, i) => (
              <motion.li
                key={order.id}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
              >
                <button
                  onClick={() => onOpenOrder?.(order.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-indigo-50/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-space text-xs font-bold text-indigo-700">
                      #{order.id}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{order.buyer_name || `Buyer #${order.buyer_id ?? '—'}`}</p>
                      <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-space text-sm font-bold text-ink">${Number(order.total ?? 0).toFixed(2)}</span>
                    <StatusBadge status={order.status} pulse={order.status === 'pending'} />
                    <FiArrowUpRight className="text-slate-300" />
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
