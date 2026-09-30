import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  FiAlertCircle, FiChevronRight, FiClock, FiLayers, FiMail, FiMapPin,
  FiPackage, FiRefreshCw, FiTrello, FiUser, FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import StatusBadge from '../../components/dashboard/StatusBadge'
import OrderStepper from '../../components/dashboard/OrderStepper'
import { extractError } from '../../components/dashboard/api'

const PIPELINE = ['pending', 'confirmed', 'shipped', 'delivered']
const LABELS = { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' }

/**
 * Supplier "Orders" tab — Kanban-style board (button-driven advance, no
 * fragile drag-and-drop) plus a list/table view toggle. Order detail opens
 * in a modal with the shared animated OrderStepper.
 */
export default function SupplierOrders() {
  const reduceMotion = useReducedMotion()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('board') // 'board' | 'list'
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [advancing, setAdvancing] = useState(null) // order id being advanced

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/api/supplier/orders')
      .then((res) => setOrders(res.data))
      .catch((err) => setError(extractError(err, 'Could not load orders')))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const byStatus = useMemo(() => {
    const map = { pending: [], confirmed: [], shipped: [], delivered: [], cancelled: [] }
    orders.forEach((o) => {
      const s = o.status || 'pending'
      if (map[s]) map[s].push(o)
    })
    return map
  }, [orders])

  const nextStatus = (status) => {
    const i = PIPELINE.indexOf(status)
    return i >= 0 && i < PIPELINE.length - 1 ? PIPELINE[i + 1] : null
  }

  const advance = async (order) => {
    const next = nextStatus(order.status)
    if (!next) return
    setAdvancing(order.id)
    try {
      const res = await api.patch(`/api/supplier/orders/${order.id}/status`, { status: next })
      setOrders((prev) => prev.map((o) => (o.id === order.id ? res.data : o)))
      if (selected?.id === order.id) setSelected(res.data)
      toast.success(`Order #${order.id} → ${LABELS[next]}`)
    } catch (err) {
      toast.error(extractError(err, 'Status update failed'))
    } finally {
      setAdvancing(null)
    }
  }

  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders

  // forwardRef is required so framer-motion's popLayout mode can measure the card
  const OrderCard = React.forwardRef(({ order }, ref) => (
    <motion.div
      ref={ref}
      layout
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.24 }}
      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => setSelected(order)} className="min-w-0 text-left">
          <p className="font-space text-sm font-bold text-ink">#{order.id} · {order.buyer?.full_name || 'Buyer'}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {order.items?.[0]?.product_name || 'Products'}{order.items?.length > 1 ? ` +${order.items.length - 1} more` : ''}
          </p>
        </button>
        <StatusBadge status={order.status} pulse={order.status === 'pending'} />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="font-space text-sm font-bold text-indigo-600">${Number(order.total ?? 0).toFixed(2)}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">
            {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
          {nextStatus(order.status) && (
            <motion.button
              whileTap={reduceMotion ? undefined : { scale: 0.9 }}
              disabled={advancing === order.id}
              onClick={() => advance(order)}
              title={`Advance to ${LABELS[nextStatus(order.status)]}`}
              className="inline-flex items-center gap-0.5 rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {advancing === order.id ? '…' : <><FiChevronRight size={11} /> Advance</>}
            </motion.button>
          )}
        </div>        </div>
      </motion.div>
  ))

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-space text-2xl font-bold tracking-tight text-ink">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">{orders.length} order(s) containing your products</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Board / list toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button onClick={() => setView('board')} aria-pressed={view === 'board'} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'board' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}>
              <span className="inline-flex items-center gap-1"><FiTrello size={12} /> Board</span>
            </button>
            <button onClick={() => setView('list')} aria-pressed={view === 'list'} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${view === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}>
              <span className="inline-flex items-center gap-1"><FiLayers size={12} /> List</span>
            </button>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400">
            <option value="">All statuses</option>
            {PIPELINE.map((s) => <option key={s} value={s}>{LABELS[s]}</option>)}
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

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-3">
              <div className="shimmer h-5 w-24 rounded" />
              <div className="shimmer h-24 rounded-xl" />
              <div className="shimmer h-24 rounded-xl" />
            </div>
          ))}
        </div>
      ) : view === 'board' ? (
        /* ---------------- Kanban board ---------------- */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PIPELINE.map((status, colIdx) => (
            <div key={status} className="min-w-0">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <h3 className="flex items-center gap-2 font-space text-sm font-bold text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${status === 'pending' ? 'bg-amber-400' : status === 'confirmed' ? 'bg-indigo-400' : status === 'shipped' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  {LABELS[status]}
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">{byStatus[status].length}</span>
              </div>
              <motion.div layout className="space-y-3 rounded-2xl bg-slate-100/60 p-2.5">
                <AnimatePresence mode="popLayout">
                  {byStatus[status].map((order) => <OrderCard key={order.id} order={order} />)}
                </AnimatePresence>
                {byStatus[status].length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs font-medium text-slate-400">Nothing {LABELS[status].toLowerCase()}</p>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        /* ---------------- List view ---------------- */
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Buyer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-slate-50 transition hover:bg-indigo-50/30">
                  <td className="px-4 py-3.5 font-space font-bold text-ink">#{order.id}</td>
                  <td className="px-4 py-3.5">{order.buyer?.full_name || order.buyer?.email || '—'}</td>
                  <td className="px-4 py-3.5 text-slate-500">{order.items?.map((i) => `${i.product_name || 'Product'} ×${i.quantity}`).join(', ') || '—'}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">${Number(order.total ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={order.status} pulse={order.status === 'pending'} /></td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      {nextStatus(order.status) && (
                        <button onClick={() => advance(order)} disabled={advancing === order.id} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-extrabold text-white transition hover:bg-indigo-700 disabled:opacity-50">
                          → {LABELS[nextStatus(order.status)]}
                        </button>
                      )}
                      <button onClick={() => setSelected(order)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-extrabold text-slate-600 transition hover:bg-slate-200">View</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No orders match this filter yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------- Order detail modal ---------------- */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 py-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm" />
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
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
                {/* Animated pipeline stepper */}
                <OrderStepper status={selected.status} />

                {/* Buyer info */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Buyer</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-800"><FiUser size={13} className="text-indigo-500" /> {selected.buyer?.full_name || '—'}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><FiMail size={12} /> {selected.buyer?.email || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Shipping</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600"><FiMapPin size={13} className="text-cyan-500" /> Provided at checkout (demo data)</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Items</p>
                  <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
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
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                    <span className="text-sm font-bold text-indigo-900">Order total</span>
                    <span className="font-space text-lg font-extrabold text-indigo-700">${Number(selected.total ?? 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Advance action */}
                {nextStatus(selected.status) && (
                  <motion.button
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    onClick={() => advance(selected)}
                    disabled={advancing === selected.id}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {advancing === selected.id ? 'Updating…' : <>Advance to {LABELS[nextStatus(selected.status)]} <FiChevronRight size={15} /></>}
                  </motion.button>
                )}
                {!nextStatus(selected.status) && selected.status !== 'cancelled' && (
                  <p className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-bold text-emerald-700">
                    <FiPackage size={15} /> Delivered — pipeline complete
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
