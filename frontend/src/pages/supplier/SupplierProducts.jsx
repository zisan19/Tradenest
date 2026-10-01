import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  FiAlertCircle, FiBox, FiEdit2, FiEye, FiEyeOff, FiImage, FiPackage,
  FiPlus, FiRefreshCw, FiTrash2,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ConfirmModal from '../../components/dashboard/ConfirmModal'
import { extractError, fetchJson, imageUrl } from '../../components/dashboard/api'

/**
 * Supplier "My Products" tab — server-side paginated product manager:
 * search / category / status filters, add & edit via the full-page
 * ProductFormPage route, toggle active, and soft-delete with animated
 * confirmation. Drafts and pending-approval states are surfaced here.
 */
export default function SupplierProducts({ categories }) {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()

  // ---- server-driven list state ------------------------------------------
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 10, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')

  const [page, setPage] = useState(1)
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: String(page), page_size: '8' })
    if (debounced) params.set('q', debounced)
    if (category) params.set('category_id', category)
    if (status) params.set('status', status)
    fetchJson(`/api/supplier/products?${params.toString()}`)
      .then(({ data, error }) => {
        if (error) setError(error)
        else setData(data)
      })
      .finally(() => setLoading(false))
  }, [page, debounced, category, status])

  useEffect(() => {
    load()
  }, [load])

  // Add/Edit happens on the dedicated full-page form route (ProductFormPage).
  const openCreate = () => navigate('/supplier/products/new')
  const openEdit = (product) => navigate(`/supplier/products/${product.id}/edit`)

  // ---- delete confirm ------------------------------------------------------
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleToggle = async (product) => {
    try {
      await api.patch(`/api/supplier/products/${product.id}/toggle`)
      toast.success(product.is_active ? 'Product delisted' : 'Product re-listed')
      load()
    } catch (err) {
      toast.error(extractError(err, 'Could not update product'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/supplier/products/${deleteTarget.id}`)
      toast.success('Product removed from marketplace')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(extractError(err, 'Could not delete product'))
    } finally {
      setDeleting(false)
    }
  }

  const stockBadge = (product) => {
    if (product.stock <= 0) return <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">Out of stock</span>
    if (product.stock <= 10) return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">Low · {product.stock}</span>
    return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{product.stock} in stock</span>
  }

  const productStatus = (p) => {
    if (p.is_draft) return 'draft'
    if (!p.is_approved) return 'pending approval'
    if (!p.is_active) return 'inactive'
    if (p.stock <= 0) return 'out of stock'
    return 'active'
  }

  const resetFilters = () => {
    setSearch(''); setCategory(''); setStatus(''); setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Header + Add button */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-space text-2xl font-bold tracking-tight text-ink">My Products</h1>
          <p className="mt-1 text-sm text-slate-500">{data.total} listing(s) in your catalog</p>
        </div>
        <motion.button
          whileHover={reduceMotion ? undefined : { scale: 1.02 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/60 transition hover:shadow-xl"
        >
          <FiPlus size={16} /> Add New Product
        </motion.button>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <FiPackage className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search products by name…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">All categories</option>
          {(categories || []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending approval</option>
          <option value="draft">Drafts</option>
          <option value="inactive">Delisted</option>
        </select>
        {(search || category || status) && (
          <button onClick={resetFilters} className="text-xs font-bold text-slate-400 transition hover:text-indigo-600">Reset</button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="card flex items-center justify-between border-rose-100 py-4">
          <span className="flex items-center gap-2 text-sm font-semibold text-rose-600"><FiAlertCircle /> {error}</span>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700"><FiRefreshCw size={12} /> Retry</button>
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card flex gap-4 p-4">
              <div className="shimmer h-20 w-20 rounded-xl" />
              <div className="flex-1 space-y-2.5 py-1">
                <div className="shimmer h-4 w-3/4 rounded" />
                <div className="shimmer h-3 w-1/2 rounded" />
                <div className="shimmer h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : data.items.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col items-center py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-400">
            <FiBox size={28} />
          </div>
          <h3 className="mt-4 font-space text-xl font-bold text-ink">
            {search || category || status ? 'No products match your filters' : "You haven't listed any products yet"}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            {search || category || status
              ? 'Try adjusting or resetting the filters above.'
              : 'List your first wholesale product and start receiving bulk orders from verified retailers.'}
          </p>
          {!(search || category || status) && (
            <button onClick={openCreate} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700">
              <FiPlus size={15} /> Add your first product
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {data.items.map((product, i) => (
              <motion.article
                key={product.id}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                className="card flex gap-4 p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {product.image_url ? (
                    <img src={imageUrl(product.image_url)} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300"><FiImage size={22} /></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-space text-sm font-bold text-ink">{product.name}</h3>
                    <StatusBadge status={productStatus(product)} pulse={productStatus(product) === 'pending approval'} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{product.description || '—'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                    <span className="font-space text-sm font-bold text-indigo-600">${Number(product.price).toFixed(2)}</span>
                    <span>MOQ {product.moq}</span>
                    {stockBadge(product)}
                    {product.category?.name && <span className="text-slate-400">{product.category.name}</span>}
                  </div>
                  {/* Quick actions */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <button onClick={() => openEdit(product)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
                      <FiEdit2 size={12} /> {product.is_draft ? 'Finish' : 'Edit'}
                    </button>
                    {!product.is_draft && (
                      <button onClick={() => handleToggle(product)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-amber-50 hover:text-amber-700">
                        {product.is_active ? <><FiEyeOff size={12} /> Delist</> : <><FiEye size={12} /> Relist</>}
                      </button>
                    )}
                    <button onClick={() => setDeleteTarget(product)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700">
                      <FiTrash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={data.page <= 1} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40">Prev</button>
          <span className="text-xs font-bold text-slate-500">Page {data.page} of {data.total_pages}</span>
          <button onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} disabled={data.page >= data.total_pages} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        danger
        busy={deleting}
        title="Delete this product?"
        message={`"${deleteTarget?.name}" will be removed from the marketplace. Order history is preserved and you can re-list it later.`}
        confirmLabel="Delete product"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
