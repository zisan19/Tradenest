import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiAlertCircle, FiCheck, FiEdit2, FiPlus, FiRefreshCw, FiSearch, FiTag, FiTrash2, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import ConfirmModal from '../../components/dashboard/ConfirmModal'
import { extractError } from '../../components/dashboard/api'

const ICON_CHOICES = ['⚡', '🏺', '🔧', '📦', '🧵', '🌿', '🍔', '💻', '🚗', '🧸', '💎', '☕']
const COLOR_CHOICES = ['#6366f1', '#f59e0b', '#0ea5e9', '#10b981', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316']
const EMPTY_FORM = { name: '', description: '', icon: '📦', color_tag: '#6366f1' }
const PAGE_SIZE = 8
const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
const button = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
const normalizeName = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase()
const safeColor = (color) => /^#[0-9a-f]{6}$/i.test(color || '') ? color : EMPTY_FORM.color_tag
const toForm = (category) => ({
  name: category.name || '', description: category.description || '',
  icon: category.icon || '📦', color_tag: safeColor(category.color_tag),
})
const sameForm = (a, b) => Object.keys(EMPTY_FORM).every((key) => a[key] === b[key])

// Keep these paths and the existing ConfirmModal interface aligned with your project.
// The API must still enforce permissions, uniqueness and product-reference constraints.
export default function AdminCategories() {
  const reduceMotion = useReducedMotion()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasLoaded, setHasLoaded] = useState(false)
  const [editor, setEditor] = useState(null) // { id, initial }; null id means create
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('asc')
  const [page, setPage] = useState(1)
  const alive = useRef(false)
  const requestId = useRef(0)
  const mutationLock = useRef(false)
  const dirty = !!editor && !sameForm(form, editor.initial)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/categories')
      if (!Array.isArray(data)) throw new Error('Expected a category list')
      if (!alive.current || id !== requestId.current) return
      setCategories(data)
      setHasLoaded(true)
    } catch (err) {
      if (alive.current && id === requestId.current) {
        setError(extractError(err, 'Could not load categories. Please retry.'))
      }
    } finally {
      if (alive.current && id === requestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    alive.current = true
    void load()
    return () => { alive.current = false; requestId.current += 1 }
  }, [load])

  useEffect(() => {
    if (!dirty && !busy) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, busy])

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return categories.filter((cat) =>
      [cat.name, cat.description, cat.slug].some((value) => String(value ?? '').toLocaleLowerCase().includes(needle)),
    ).sort((a, b) => {
      const order = String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base', numeric: true })
      return sort === 'desc' ? -order : order
    })
  }, [categories, query, sort])
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  useEffect(() => { setPage((old) => Math.min(old, pageCount)) }, [pageCount])

  const duplicate = !!editor && categories.some((cat) =>
    String(cat.id) !== String(editor.id) && normalizeName(cat.name) === normalizeName(form.name),
  )
  const formError = !form.name.trim() ? 'Category name is required.'
    : duplicate ? 'A category with this name already exists.' : ''

  const canDiscard = () => !dirty || window.confirm('Discard your unsaved category changes?')
  const closeEditor = () => {
    if (!mutationLock.current && canDiscard()) setEditor(null)
  }
  const openEditor = (category = null) => {
    if (mutationLock.current || !canDiscard()) return
    const initial = category ? toForm(category) : { ...EMPTY_FORM }
    setForm(initial)
    setEditor({ id: category?.id ?? null, initial })
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (mutationLock.current || !editor || loading || error) return
    if (formError) { toast.error(formError); return }
    mutationLock.current = true
    setBusy(true)
    const creating = editor.id === null
    const payload = { ...form, name: form.name.trim().replace(/\s+/g, ' '), description: form.description.trim() }
    try {
      if (creating) await api.post('/api/admin/categories', payload)
      else await api.patch(`/api/admin/categories/${encodeURIComponent(editor.id)}`, payload)
      if (!alive.current) return
      toast.success(creating ? 'Category created' : 'Category updated')
      setEditor(null)
      setQuery('')
      setPage(1)
      await load()
    } catch (err) {
      if (alive.current) toast.error(extractError(err, 'Save failed. Your changes are still in the form.'))
    } finally {
      mutationLock.current = false
      if (alive.current) setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (mutationLock.current || !deleteTarget || loading || error) return
    mutationLock.current = true
    setBusy(true)
    const target = deleteTarget
    try {
      await api.delete(`/api/admin/categories/${encodeURIComponent(target.id)}`)
      if (!alive.current) return
      setCategories((old) => old.filter((cat) => cat.id !== target.id))
      setDeleteTarget(null)
      toast.success('Category deleted')
      await load()
    } catch (err) {
      if (alive.current) toast.error(extractError(err, 'Delete failed. This category may still be used by products.'))
    } finally {
      mutationLock.current = false
      if (alive.current) setBusy(false)
    }
  }

  const locked = busy || loading || !!error || !hasLoaded
  return (
    <div className="space-y-5 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Category management</h1>
          <p className="mt-1 text-sm text-slate-500">Organize your marketplace with clear names, icons and colours.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} disabled={loading || busy} className={button}>
            <FiRefreshCw className={loading && !reduceMotion ? 'animate-spin' : ''} aria-hidden="true" />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" onClick={() => openEditor()} disabled={locked || !!deleteTarget}
            className={`${button} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`}>
            <FiPlus aria-hidden="true" /> New category
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Total categories', categories.length],
          ['With descriptions', categories.filter((cat) => String(cat.description || '').trim()).length],
          ['Matching search', results.length],
        ].map(([label, value]) => (
          <div key={label} className={panel}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{hasLoaded ? value : '—'}</p>
          </div>
        ))}
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <span className="flex items-center gap-2"><FiAlertCircle aria-hidden="true" />{error}{hasLoaded && ' Showing the last loaded list.'}</span>
        <button type="button" className={button} disabled={loading || busy} onClick={() => void load()}>Retry</button>
      </div>}

      <AnimatePresence initial={false}>
        {editor && <motion.section key={`editor-${editor.id ?? 'new'}`}
          initial={reduceMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.15 }}
          className={`${panel} border-indigo-200`} aria-labelledby="category-editor-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="category-editor-title" className="text-lg font-bold">{editor.id === null ? 'New category' : `Edit ${editor.initial.name}`}</h2>
            <button type="button" className={button} aria-label="Close category editor" onClick={closeEditor} disabled={busy}><FiX /></button>
          </div>
          <CategoryForm form={form} setForm={setForm} busy={busy} blocked={locked} dirty={dirty}
            creating={editor.id === null} error={formError} onSave={handleSave} onCancel={closeEditor} />
        </motion.section>}
      </AnimatePresence>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="category-search" className="sr-only">Search categories</label>
          <FiSearch className="pointer-events-none absolute left-3 top-3.5 text-slate-400" aria-hidden="true" />
          <input id="category-search" type="search" value={query} placeholder="Search name, description or slug…"
            className={`${input} pl-10`} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          Sort
          <select value={sort} className={input} onChange={(event) => { setSort(event.target.value); setPage(1) }}>
            <option value="asc">Name: A–Z</option><option value="desc">Name: Z–A</option>
          </select>
        </label>
      </div>

      <section aria-label="Categories" aria-busy={loading} className="space-y-3">
        {loading && !hasLoaded ? <div role="status" className={`${panel} text-center text-slate-500`}>Loading categories…</div>
          : !hasLoaded ? null
          : visible.length === 0 ? <div className={`${panel} py-12 text-center`}>
            <FiTag className="mx-auto mb-3 text-3xl text-indigo-400" aria-hidden="true" />
            <h2 className="font-bold">{categories.length ? 'No matching categories' : 'No categories yet'}</h2>
            <p className="mt-1 text-sm text-slate-500">{categories.length ? 'Try a different name or clear your search.' : 'Create a category to organize your products.'}</p>
            {query && <button type="button" className={`${button} mt-4`} onClick={() => { setQuery(''); setPage(1) }}>Clear search</button>}
          </div>
          : visible.map((cat) => <article key={cat.id} className={`${panel} flex flex-wrap items-center gap-4`}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: `${safeColor(cat.color_tag)}1a` }} aria-hidden="true">{cat.icon || '📦'}</span>
            <div className="min-w-0 flex-1">
              <h2 className="break-words font-bold">{cat.name}</h2>
              <p className="mt-1 break-words text-sm text-slate-500">{cat.description || 'No description'}</p>
              {cat.slug && <p className="mt-1 break-all text-xs text-slate-400">/{cat.slug}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" className={button} disabled={locked || !!deleteTarget} aria-label={`Edit ${cat.name}`} onClick={() => openEditor(cat)}><FiEdit2 /></button>
              <button type="button" className={`${button} text-rose-600`} disabled={locked || !!editor || !!deleteTarget}
                aria-label={`Delete ${cat.name}`} onClick={() => setDeleteTarget(cat)}><FiTrash2 /></button>
            </div>
          </article>)}
      </section>

      {hasLoaded && results.length > 0 && <nav aria-label="Category pagination" className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500" role="status">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, results.length)} of {results.length}</p>
        <div className="flex items-center gap-3">
          <button type="button" className={button} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
          <span className="text-sm">{currentPage} / {pageCount}</span>
          <button type="button" className={button} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
        </div>
      </nav>}

      <ConfirmModal open={!!deleteTarget} danger busy={busy} title="Delete this category?"
        message={`"${deleteTarget?.name || ''}" will be removed. Categories still used by products cannot be deleted.`}
        confirmLabel="Delete category" onCancel={() => { if (!mutationLock.current) setDeleteTarget(null) }} onConfirm={handleDelete} />
    </div>
  )
}

function CategoryForm({ form, setForm, busy, blocked, dirty, creating, error, onSave, onCancel }) {
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }))
  return (
    <form onSubmit={onSave} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
        <legend className="sr-only">Category details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category-name" className="mb-1.5 block text-sm font-semibold">Name <span className="text-rose-500">*</span></label>
            <input id="category-name" autoFocus required value={form.name} onChange={(event) => update('name', event.target.value)}
              className={input} placeholder="e.g. Textiles" aria-invalid={!!error} aria-describedby={error ? 'category-form-error' : undefined} />
          </div>
          <div>
            <label htmlFor="category-description" className="mb-1.5 block text-sm font-semibold">Description</label>
            <textarea id="category-description" rows={2} value={form.description} onChange={(event) => update('description', event.target.value)}
              className={input} placeholder="What belongs in this category?" />
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Icon</legend>
          <div className="flex flex-wrap gap-2">
            {ICON_CHOICES.map((icon) => <button key={icon} type="button" aria-label={`Select icon ${icon}`}
              aria-pressed={form.icon === icon} onClick={() => update('icon', icon)}
              className={`${button} h-10 w-10 p-0 text-xl ${form.icon === icon ? 'bg-indigo-50 ring-2 ring-indigo-500' : ''}`}>{icon}</button>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Colour tag</legend>
          <div className="flex flex-wrap gap-3">
            {COLOR_CHOICES.map((color) => <button key={color} type="button" aria-label={`Select colour ${color}`} aria-pressed={form.color_tag === color}
              onClick={() => update('color_tag', color)} className="flex h-9 w-9 items-center justify-center rounded-full text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: color, outline: form.color_tag === color ? '2px solid #0f172a' : undefined, outlineOffset: 3 }}>
              {form.color_tag === color && <FiCheck aria-hidden="true" />}
            </button>)}
          </div>
        </fieldset>
      </fieldset>
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${safeColor(form.color_tag)}1a` }} aria-hidden="true">{form.icon}</span>
          <div className="min-w-0"><p className="break-words font-semibold">{form.name.trim() || 'Category name'}</p><p className="break-words text-sm text-slate-500">{form.description.trim() || 'Your description appears here.'}</p></div>
        </div>
      </div>
      {error && <p id="category-form-error" role="status" className="text-sm text-rose-600">{error}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {dirty && <span className="mr-auto text-xs text-amber-700">Unsaved changes</span>}
        <button type="button" className={button} disabled={busy} onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={blocked || !!error || (!creating && !dirty)}
          className={`${button} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`}>
          <FiCheck aria-hidden="true" />{busy ? 'Saving…' : creating ? 'Create category' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
