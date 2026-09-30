import React, { useEffect, useState } from 'react'
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import api from '../../api/axios'
import { ChartCard, BarsChart, DonutChart, STATUS_COLORS } from '../../components/dashboard/Chart'
import { extractError } from '../../components/dashboard/api'

const RANGES = [
  { key: '7', label: '7D' },
  { key: '30', label: '30D' },
  { key: 'all', label: 'All time' },
]

const STATUS_LABELS = { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }

/**
 * Supplier Analytics tab — best sellers, order-status mix and revenue by
 * category, all backed by /api/supplier/analytics with a date-range filter.
 */
export default function SupplierAnalytics() {
  const [range, setRange] = useState('30')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError(null)
    const qs = range !== 'all' ? `?days=${range}` : ''
    api
      .get(`/api/supplier/analytics${qs}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(extractError(err, 'Could not load analytics')))
      .finally(() => setLoading(false))
  }
  useEffect(load, [range])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card h-72 p-6">
            <div className="shimmer h-5 w-36 rounded" />
            <div className="shimmer mt-6 h-44 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card flex flex-col items-center py-14 text-center">
        <FiAlertCircle className="text-rose-500" size={28} />
        <p className="mt-3 font-space text-lg font-bold text-ink">Couldn't load analytics</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"><FiRefreshCw size={14} /> Try again</button>
      </div>
    )
  }

  const maxUnits = Math.max(1, ...(data.best_selling || []).map((p) => p.units_sold))
  const statusLabels = (data.orders_by_status || []).map((s) => STATUS_LABELS[s.status] || s.status)
  const statusValues = (data.orders_by_status || []).map((s) => s.count)
  const statusColors = (data.orders_by_status || []).map((s) => STATUS_COLORS[s.status] || '#94a3b8')

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-space text-2xl font-bold tracking-tight text-ink">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">What's selling, and how orders flow through your pipeline.</p>
        </div>
        <div className="inline-flex self-start rounded-xl border border-slate-200 bg-white p-1">
          {RANGES.map((option) => (
            <button
              key={option.key}
              onClick={() => setRange(option.key)}
              aria-pressed={range === option.key}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${range === option.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Best sellers — ranked animated progress bars */}
      <div className="card p-6">
        <h2 className="font-space text-lg font-bold text-ink">Best-selling products</h2>
        <p className="mt-0.5 text-xs text-slate-500">Ranked by units sold in the selected period</p>
        <div className="mt-5 space-y-4">
          {(data.best_selling || []).length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">No sales recorded in this period yet.</p>
          )}
          {(data.best_selling || []).map((product, i) => (
            <div key={product.product_id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-slate-700">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-extrabold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</span>
                  {product.name}
                </span>
                <span className="text-xs font-bold text-slate-500">{product.units_sold.toLocaleString()} units · ${product.revenue.toLocaleString()}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                  style={{ width: `${(product.units_sold / maxUnits) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard title="Orders by status" subtitle="Distribution across the fulfilment pipeline">
          <DonutChart
            labels={statusLabels}
            data={statusValues}
            colors={statusColors}
          />
        </ChartCard>
        <ChartCard title="Revenue by category" subtitle="Where your sales concentrate">
          <BarsChart
            labels={(data.revenue_by_category || []).map((c) => c.category)}
            data={(data.revenue_by_category || []).map((c) => c.revenue)}
            color="#06b6d4"
          />
        </ChartCard>
      </div>
    </div>
  )
}
