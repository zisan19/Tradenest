import React, { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiAlertCircle, FiRefreshCw, FiX } from 'react-icons/fi'
import api from '../../api/axios'
import StatusBadge from '../../components/dashboard/StatusBadge'
import OrderStepper from '../../components/dashboard/OrderStepper'
import { extractError } from '../../components/dashboard/api'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const RANGES = [
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '', label: 'All time' },
]

/**
 * Admin "Order Oversight" tab — platform-wide order table with status/date
 * filters and supplier column. Detail modal reuses the shared OrderStepper.
 */
export default function AdminOrders() {
  const reduceMotion = useReducedMotion()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('')
  const [days, setDays] = useState('')
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ limit: '100' })
    if (status) params.set('status', status)
    if (days) params.set('days', days)
    api
      .get(`/api/admin/orders?${params.toString()}`)
      .then((res) => setOrders(res.data))
      .catch((err) => setError(extractError(err, 'Could not load orders')))
      .finally(() => setLoading(false))
  }, [status, days])
  useEffect(load, [load])

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-space text-2xl font-bold tracking-tight text-ink">Order Oversight</h1>
          <p className="mt-1 text-sm text-slate-500">All {orders.length} order(s) across every supplier and retailer</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select value={days} onChange={(e) => setDays(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400">
            {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <button onClick={load} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50" aria-label="Refresh"><FiRefreshCw size={14} /></button>
        </div>
      </div>

      {error && (
        <div className="card flex items-center justify-between border-rose-100">
          <span className="flex items-center gap-2 text-sm font-semibold text-rose-600"><FiAlertCircle /> {error}</span>
          <button onClick={load} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">Retry</button>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Buyer</th>
              <th className="px-4 py-3 font-semibold">Supplier(s)</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {Array.from({ length: 7 }, (_, j) => (
                    <td key={j} className="px-4 py-3.5"><div className="shimmer h-4 w-4/5 rounded" /></td>
                  ))}
                </tr>
              ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-400">No orders match these filters.</td></tr>
            )}
            {!loading &&
              orders.map((order, i) => (
                <motion.tr
                  key={order.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  onClick={() => setSelected(order)}
                  className="cursor-pointer border-b border-slate-50 transition hover:bg-indigo-50/40"
                >
                  <td className="px-4 py-3.5 font-space font-bold text-indigo-600">#{order.id}</td>
                  <td className="px-4 py-3.5">{order.buyer?.full_name || order.buyer?.email || '—'}</td>
                  <td className="max-w-[160px] truncate px-4 py-3.5 text-slate-500">{order.supplier_names?.join(', ') || '—'}</td>
                  <td className="px-4 py-3.5 text-slate-500">{order.items?.length} item(s)</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">${Number(order.total ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={order.status} pulse={order.status === 'pending'} /></td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Detail modal — reuses the shared OrderStepper for consistency */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 py-10">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelected(null)} className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" />
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="font-space text-lg font-bold text-ink">Order #{selected.id}</h2>
                <p className="text-xs text-slate-400">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} pulse={selected.status === 'pending'} />
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><FiX size={18} /></button>
              </div>
            </div>
            <div className="space-y-5 px-6 py-5">
              <OrderStepper status={selected.status} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Buyer</p>
                  <p className="mt-1.5 text-sm font-bold text-slate-800">{selected.buyer?.full_name || '—'}</p>
                  <p className="text-xs text-slate-500">{selected.buyer?.email}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Supplier(s)</p>
                  <p className="mt-1.5 text-sm font-bold text-slate-800">{selected.supplier_names?.join(', ') || '—'}</p>
                </div>
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {selected.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{item.product_name || `Product #${item.product_id}`}</p>
                      <p className="text-xs text-slate-400">${Number(item.unit_price).toFixed(2)} × {item.quantity} units</p>
                    </div>
                    <span className="font-space text-sm font-bold text-ink">${(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                <span className="text-sm font-bold text-indigo-900">Order total</span>
                <span className="font-space text-lg font-extrabold text-indigo-700">${Number(selected.total ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
