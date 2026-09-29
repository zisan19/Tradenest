import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiAlertCircle, FiCheck, FiImage, FiPackage, FiRefreshCw, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ConfirmModal from '../../components/dashboard/ConfirmModal'
import { extractError, imageUrl } from '../../components/dashboard/api'

/**
 * Admin "Supplier & Product Approval" tab — card-based review queue.
 * Approve plays a checkmark animation and the card animates out of the
 * queue; Reject opens an inline reason input before animating out.
 */
export default function AdminApprovals({ onChanged }) {
  const reduceMotion = useReducedMotion()
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [approvedId, setApprovedId] = useState(null) // plays checkmark animation
  const [rejectTarget, setRejectTarget] = useState(null) // { type, id, name }
  const [rejectReason, setRejectReason] = useState('')
  const [rejectBusy, setRejectBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([api.get('/api/admin/suppliers/pending'), api.get('/api/admin/products/pending')])
      .then(([sRes, pRes]) => {
        setSuppliers(sRes.data)
        setProducts(pRes.data)
      })
      .catch((err) => setError(extractError(err, 'Could not load the review queue')))
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const approve = async (type, id, name) => {
    setBusyId(`${type}-${id}`)
    try {
      if (type === 'supplier') {
        await api.patch(`/api/admin/suppliers/${id}/approve`)
        setSuppliers((prev) => prev.filter((s) => s.id !== id))
      } else {
        await api.patch(`/api/admin/products/${id}/approve`)
        setProducts((prev) => prev.filter((p) => p.id !== id))
      }
      setApprovedId(`${type}-${id}`) // trigger checkmark overlay
      setTimeout(() => setApprovedId(null), 900)
      toast.success(`${type === 'supplier' ? 'Supplier' : 'Product'} approved: ${name}`)
      onChanged?.()
    } catch (err) {
      toast.error(extractError(err, 'Approval failed'))
    } finally {
      setBusyId(null)
    }
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    setRejectBusy(true)
    try {
      if (rejectTarget.type === 'supplier') {
        await api.patch(`/api/admin/suppliers/${rejectTarget.id}/reject`, { reason: rejectReason || null })
        setSuppliers((prev) => prev.filter((s) => s.id !== rejectTarget.id))
      } else {
        await api.patch(`/api/admin/products/${rejectTarget.id}/reject`, { reason: rejectReason || null })
        setProducts((prev) => prev.filter((p) => p.id !== rejectTarget.id))
      }
      toast.success(`${rejectTarget.type === 'supplier' ? 'Supplier' : 'Product'} rejected`)
      setRejectTarget(null)
      setRejectReason('')
      onChanged?.()
    } catch (err) {
      toast.error(extractError(err, 'Rejection failed'))
    } finally {
      setRejectBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card h-52 p-5">
            <div className="shimmer h-5 w-32 rounded" />
            <div className="shimmer mt-4 h-3 w-3/4 rounded" />
            <div className="shimmer mt-2 h-3 w-1/2 rounded" />
            <div className="shimmer mt-6 h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card flex flex-col items-center py-14 text-center">
        <FiAlertCircle className="text-rose-500" size={28} />
        <p className="mt-3 font-space text-lg font-bold text-ink">Couldn't load the review queue</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"><FiRefreshCw size={14} /> Try again</button>
      </div>
    )
  }

  const isEmpty = suppliers.length === 0 && products.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-space text-2xl font-bold tracking-tight text-ink">Approval Queue</h1>
        <p className="mt-1 text-sm text-slate-500">Review new suppliers and product listings before they go live.</p>
      </div>

      {isEmpty && (
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col items-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
            <FiCheck size={28} />
          </div>
          <h3 className="mt-4 font-space text-xl font-bold text-ink">All caught up!</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">No suppliers or products are waiting for review. New submissions will appear here automatically.</p>
        </motion.div>
      )}

      {/* Pending suppliers */}
      {suppliers.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-space text-lg font-bold text-ink">
            Pending suppliers <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-700">{suppliers.length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {suppliers.map((supplier) => (
                <motion.div
                  key={supplier.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, x: -30 }}
                  transition={{ duration: 0.28 }}
                  className="card relative p-5"
                >
                  {approvedId === `supplier-${supplier.id}` && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-emerald-50/90"
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                      >
                        <FiCheck size={26} />
                      </motion.span>
                    </motion.div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-space text-sm font-bold text-white">
                        {(supplier.company_name || supplier.full_name || '?').charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-space text-sm font-bold text-ink">{supplier.company_name || supplier.full_name}</p>
                        <p className="truncate text-xs text-slate-400">{supplier.email}</p>
                      </div>
                    </div>
                    <StatusBadge status="pending" />
                  </div>
                  {supplier.store_description && <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{supplier.store_description}</p>}
                  <div className="mt-3 flex gap-4 text-xs font-semibold text-slate-500">
                    <span>{supplier.product_count} product(s)</span>
                    {supplier.pending_product_count > 0 && <span className="text-amber-600">{supplier.pending_product_count} awaiting review</span>}
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <motion.button
                      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                      disabled={busyId === `supplier-${supplier.id}`}
                      onClick={() => approve('supplier', supplier.id, supplier.company_name || supplier.full_name)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busyId === `supplier-${supplier.id}` ? '…' : <><FiCheck size={14} /> Approve</>}
                    </motion.button>
                    <button
                      onClick={() => { setRejectTarget({ type: 'supplier', id: supplier.id, name: supplier.company_name || supplier.full_name }) }}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50"
                    >
                      <FiX size={14} /> Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Pending products */}
      {products.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-space text-lg font-bold text-ink">
            Pending products <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-700">{products.length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, x: -30 }}
                  transition={{ duration: 0.28 }}
                  className="card relative p-5"
                >
                  {approvedId === `product-${product.id}` && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-emerald-50/90">
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                        <FiCheck size={26} />
                      </motion.span>
                    </motion.div>
                  )}
                  <div className="flex gap-3.5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {product.image_url ? <img src={imageUrl(product.image_url)} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><FiImage size={20} /></div>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-space text-sm font-bold text-ink">{product.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">by {product.supplier_company || product.supplier_name || 'Unknown supplier'}</p>
                      <p className="mt-1.5 font-space text-sm font-bold text-indigo-600">${Number(product.price).toFixed(2)} <span className="text-xs font-medium text-slate-400">· MOQ {product.moq}</span></p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <motion.button
                      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                      disabled={busyId === `product-${product.id}`}
                      onClick={() => approve('product', product.id, product.name)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busyId === `product-${product.id}` ? '…' : <><FiCheck size={14} /> Approve</>}
                    </motion.button>
                    <button
                      onClick={() => setRejectTarget({ type: 'product', id: product.id, name: product.name })}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50"
                    >
                      <FiX size={14} /> Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* Reject reason modal */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !rejectBusy && setRejectTarget(null)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" />
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <FiX size={22} />
              </div>
              <h3 className="mt-4 text-center font-space text-lg font-bold text-ink">
                Reject {rejectTarget.type}?
              </h3>
              <p className="mt-1.5 text-center text-sm text-slate-500">
                "{rejectTarget.name}" will not appear on the marketplace.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Optional reason (visible to the supplier)…"
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60"
              />
              <div className="mt-5 flex gap-3">
                <button onClick={() => setRejectTarget(null)} disabled={rejectBusy} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                <motion.button whileTap={reduceMotion ? undefined : { scale: 0.96 }} onClick={confirmReject} disabled={rejectBusy} className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-rose-700 disabled:opacity-60">
                  {rejectBusy ? 'Rejecting…' : 'Reject'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
