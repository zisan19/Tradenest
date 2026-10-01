import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiAlertCircle, FiCheck, FiEdit2, FiPlus, FiRefreshCw, FiTag, FiTrash2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import ConfirmModal from '../../components/dashboard/ConfirmModal'
import { extractError } from '../../components/dashboard/api'

const ICON_CHOICES = ['⚡', '🏺', '🔧', '📦', '🧵', '🌿', '🍔', '💻', '🚗', '🧸', '💎', '☕']
const COLOR_CHOICES = ['#6366f1', '#f59e0b', '#0ea5e9', '#10b981', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316']

/**
 * Admin "Category Management" tab — inline add/edit/delete with icon picker
 * and colour tags. All mutations are audited server-side.
 */
export default function AdminCategories() {
  const reduceMotion = useReducedMotion()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null) // null = not editing; 'new' = creating
  const [form, setForm] = useState({ name: '', description: '', icon: '📦', color_tag: '#6366f1' })
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/api/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => setError(extractError(err, 'Could not load categories')))
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const startCreate = () => {
    setEditingId('new')
    setForm({ name: '', description: '', icon: '📦', color_tag: COLOR_CHOICES[0] })
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '📦', color_tag: cat.color_tag || COLOR_CHOICES[0] })
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Category name is required')
      return
    }
    setBusy(true)
    try {
      if (editingId === 'new') {
        await api.post('/api/admin/categories', { ...form, name: form.name.trim() })
        toast.success('Category created')
      } else {
        await api.patch(`/api/admin/categories/${editingId}`, { ...form, name: form.name.trim() })
        toast.success('Category updated')
      }
      setEditingId(null)
      load()
    } catch (err) {
      toast.error(extractError(err, 'Save failed'))
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await api.delete(`/api/admin/categories/${deleteTarget.id}`)
      toast.success('Category deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      // e.g. category still referenced by products — surface the backend detail
      toast.error(extractError(err, 'Delete failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-space text-2xl font-bold tracking-tight text-ink">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">{categories.length} marketplace categor(y/ies)</p>
        </div>
        <motion.button
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg"
        >
          <FiPlus size={15} /> New category
        </motion.button>
      </div>

      {error && (
        <div className="card flex items-center justify-between border-rose-100">
          <span className="flex items-center gap-2 text-sm font-semibold text-rose-600"><FiAlertCircle /> {error}</span>
          <button onClick={load} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="card flex items-center gap-4 p-4">
              <div className="shimmer h-10 w-10 rounded-xl" />
              <div className="shimmer h-4 w-40 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Inline create row */}
          <AnimatePresence>
            {editingId === 'new' && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card space-y-4 border-indigo-100 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-space text-base font-bold text-ink">New category</h3>
                    <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><FiX size={16} /></button>
                  </div>
                  <CategoryForm form={form} setForm={setForm} busy={busy} onSave={handleSave} onCancel={() => setEditingId(null)} saveLabel="Create" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {categories.map((cat) => (
              <motion.div key={cat.id} layout initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                {editingId === cat.id ? (
                  <div className="card space-y-4 border-indigo-100 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-space text-base font-bold text-ink">Edit "{cat.name}"</h3>
                      <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><FiX size={16} /></button>
                    </div>
                    <CategoryForm form={form} setForm={setForm} busy={busy} onSave={handleSave} onCancel={() => setEditingId(null)} saveLabel="Save changes" />
                  </div>
                ) : (
                  <div className="card flex items-center gap-4 p-4 transition hover:border-indigo-100">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-inner" style={{ backgroundColor: `${cat.color_tag || '#6366f1'}1a` }}>
                      {cat.icon || <FiTag className="text-slate-400" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-space text-sm font-bold text-ink">
                        {cat.name}
                        <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: cat.color_tag || '#94a3b8' }} />
                      </p>
                      <p className="truncate text-xs text-slate-400">{cat.description || 'No description'} · /{cat.slug}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => startEdit(cat)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700">
                        <FiEdit2 size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(cat)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700">
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        danger
        busy={busy}
        title="Delete this category?"
        message={`"${deleteTarget?.name}" will be removed. Categories still used by products cannot be deleted.`}
        confirmLabel="Delete category"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function CategoryForm({ form, setForm, busy, onSave, onCancel, saveLabel }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Textiles"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60"
          />
        </div>
      </div>
      {/* Icon picker */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Icon</label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {ICON_CHOICES.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setForm({ ...form, icon })}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${form.icon === icon ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-slate-50 hover:bg-slate-100'}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
      {/* Color picker */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Colour tag</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {COLOR_CHOICES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm({ ...form, color_tag: color })}
              className={`h-8 w-8 rounded-full transition ${form.color_tag === color ? 'ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'}`}
              style={{ backgroundColor: color }}
              aria-label={`Colour ${color}`}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
        <button onClick={onCancel} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</button>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onSave} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60">
          <FiCheck size={14} /> {busy ? 'Saving…' : saveLabel}
        </motion.button>
      </div>
    </div>
  )
}
