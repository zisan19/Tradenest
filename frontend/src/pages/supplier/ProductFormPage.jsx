import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  FiArrowLeft, FiCheck, FiCheckCircle, FiChevronUp, FiEdit3, FiFileText,
  FiImage, FiInfo, FiPackage, FiRefreshCw, FiShoppingBag, FiStar, FiTag,
  FiUploadCloud, FiX, FiAlertCircle, FiDollarSign, FiList, FiPlus,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { extractError, imageUrl } from '../../components/dashboard/api'
import AnimatedCounter from '../../components/dashboard/AnimatedCounter'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { useAuth } from '../../context/AuthContext'

/* ------------------------------------------------------------------ */
/* Constants & helpers                                                 */
/* ------------------------------------------------------------------ */

const UNITS = ['piece', 'box', 'kg', 'carton', 'set', 'pack', 'pallet']

const LIMITS = {
  title: 100,
  short: 150,
  description: 2000,
  descriptionMin: 50,
}

const SECTIONS = [
  { id: 'basic', label: 'Basic Info', icon: <FiList size={13} /> },
  { id: 'description', label: 'Description', icon: <FiFileText size={13} /> },
  { id: 'pricing', label: 'Pricing', icon: <FiDollarSign size={13} /> },
  { id: 'images', label: 'Images', icon: <FiImage size={13} /> },
  { id: 'tags', label: 'Tags', icon: <FiTag size={13} /> },
  { id: 'review', label: 'Review', icon: <FiCheckCircle size={13} /> },
]

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

const emptyForm = () => ({
  name: '',
  short_description: '',
  description: '',
  price: '',
  moq: '',
  unit: 'piece',
  stock: '',
  category_id: '',
  tags: [],
  images: [], // [{ id, url, name, progress }]
})

/** localStorage autosave key — per user so two suppliers never share a draft. */
const draftKey = (email) => `tradenest:product-draft:${email || 'anon'}`

/** Build the API payload from form state (numbers parsed, lists cleaned). */
const formToPayload = (form, isDraft) => ({
  name: form.name.trim(),
  short_description: form.short_description.trim() || null,
  description: form.description.trim(),
  price: Number(form.price),
  moq: Number(form.moq),
  unit: form.unit,
  stock: Number(form.stock),
  category_id: form.category_id ? Number(form.category_id) : null,
  tags: form.tags,
  image_urls: form.images.map((im) => im.url),
  is_draft: isDraft,
})

/** Counter colour shifts as a field approaches its limit. */
const counterClass = (len, max) => {
  if (len > max) return 'text-rose-500'
  if (len > max * 0.9) return 'text-amber-500'
  return 'text-slate-400'
}

/* ------------------------------------------------------------------ */
/* Small shared form primitives                                        */
/* ------------------------------------------------------------------ */

/** Floating-label input that lifts the label when filled or focused. */
function FloatingInput({ id, label, error, valid, counter, className = '', inputClass = '', ...props }) {
  const [focused, setFocused] = useState(false)
  const filled = props.value !== undefined && String(props.value).length > 0
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
        className={`peer w-full rounded-xl border bg-white px-3.5 pt-5 pb-1.5 text-sm font-semibold text-ink outline-none transition focus:ring-4 ${inputClass}`}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3.5 transition-all duration-200 ${
          focused || filled
            ? 'top-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-500'
            : 'top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400'
        }`}
      >
        {label}
      </label>
      {counter && (
        <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold ${counter.cls}`}>
          {counter.text}
        </span>
      )}
      <AnimatePresence>
        {valid && !error && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
          >
            <FiCheck size={15} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/** One labelled block: heading, children, animated error, hint. */
function Field({ id, label, required, error, hint, counter, children }) {
  const counterNode = counter && (
    <span className={`text-[11px] font-bold ${counterClass(counter.len, counter.max)}`}>
      {counter.len}/{counter.max}
    </span>
  )
  return (
    <div id={id} className="scroll-mt-32">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {counterNode}
      </div>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-500"
          >
            <FiAlertCircle size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>
      {!error && hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

/** Shake animation wrapper — mounts briefly whenever `trigger` increments. */
function Shake({ trigger, children }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      key={trigger}
      animate={trigger && !reduce ? { x: [0, -7, 7, -5, 5, -2, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

export default function ProductFormPage({ categories = [] }) {
  const navigate = useNavigate()
  const { id } = useParams() // present in edit mode
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const reduceMotion = useReducedMotion()

  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(isEdit)
  const [original, setOriginal] = useState(null) // product being edited
  const [errors, setErrors] = useState({})
  const [shakeKey, setShakeKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')
  const [draftRestored, setDraftRestored] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const restoredRef = useRef(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  /* ---- load existing product (edit mode) ------------------------------ */
  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api
      .get(`/api/supplier/products/${id}`)
      .then(({ data: p }) => {
        setOriginal(p)
        setForm({
          name: p.name ?? '',
          short_description: p.short_description ?? '',
          description: p.description ?? '',
          price: p.price ?? '',
          moq: p.moq ?? '',
          unit: p.unit ?? 'piece',
          stock: p.stock ?? '',
          category_id: p.category_id ? String(p.category_id) : '',
          tags: Array.isArray(p.tags) ? p.tags : [],
          images: (p.image_urls || []).map((url) => ({ id: url, url, name: url.split('/').pop(), progress: 100 })),
        })
      })
      .catch((err) => {
        toast.error(extractError(err, 'Could not load product'))
        navigate('/supplier/products')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate])

  /* ---- restore autosaved draft (create mode only) ---------------------- */
  useEffect(() => {
    if (isEdit || restoredRef.current) return
    restoredRef.current = true
    try {
      const raw = localStorage.getItem(draftKey(user?.email))
      if (!raw) return
      const d = JSON.parse(raw)
      if (!d || (!d.name && !d.description)) return
      setForm({
        ...emptyForm(),
        ...d,
        tags: Array.isArray(d.tags) ? d.tags : [],
        images: (d.images || []).map((url) => ({ id: url, url, name: url.split('/').pop(), progress: 100 })),
      })
      setDraftRestored(true)
      toast('Draft restored', { icon: '✍️' })
    } catch { /* corrupted draft — ignore */ }
  }, [isEdit, user?.email])

  /* ---- autosave on every change (debounced) ---------------------------- */
  useEffect(() => {
    if (isEdit) return undefined
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey(user?.email),
          JSON.stringify({ ...form, images: form.images.map((i) => i.url), savedAt: Date.now() }),
        )
        setLastSaved(new Date())
      } catch { /* storage full — ignore */ }
    }, 600)
    return () => clearTimeout(t)
  }, [form, isEdit, user?.email])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey(user?.email))
    setLastSaved(null)
  }, [user?.email])

  /* ---- scroll-spy for the sticky section nav --------------------------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-25% 0px -60% 0px' },
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [loading]) // re-attach once content is rendered

  /* ---- derived values --------------------------------------------------- */
  const minOrderValue = useMemo(() => {
    const p = Number(form.price)
    const m = Number(form.moq)
    return p > 0 && m > 0 ? p * m : 0
  }, [form.price, form.moq])

  const descLen = form.description.length
  const descWords = form.description.trim() ? form.description.trim().split(/\s+/).length : 0

  const completion = useMemo(() => {
    const checks = [
      form.name.trim().length >= 3,
      form.description.trim().length >= LIMITS.descriptionMin,
      Number(form.price) > 0,
      Number(form.moq) >= 1,
      Number(form.stock) >= 0 && form.stock !== '',
      !!form.category_id,
      form.images.length > 0,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [form])

  /* ---- validation -------------------------------------------------------- */
  /* Drafts only need a title; full submissions enforce every quality bar. */
  const validate = (draftMode) => {
    const errs = {}
    const name = form.name.trim()
    if (!name) errs.name = 'Product title is required'
    else if (name.length > LIMITS.title) errs.name = `Keep the title under ${LIMITS.title} characters`
    if (draftMode) {
      setErrors(errs)
      return errs
    }
    if (name.length < 3) errs.name = `Title needs at least 3 characters (${name.length}/3)`

    const desc = form.description.trim()
    if (!desc) errs.description = 'A detailed description is required'
    else if (desc.length < LIMITS.descriptionMin)
      errs.description = `Add at least ${LIMITS.descriptionMin} characters — ${LIMITS.descriptionMin - desc.length} more to go`
    else if (desc.length > LIMITS.description) errs.description = `Max ${LIMITS.description} characters`

    const price = Number(form.price)
    if (form.price === '' || Number.isNaN(price)) errs.price = 'Enter a price'
    else if (price <= 0) errs.price = 'Price must be greater than 0'

    const moq = Number(form.moq)
    if (form.moq === '' || Number.isNaN(moq)) errs.moq = 'Set a minimum order quantity'
    else if (moq < 1) errs.moq = 'MOQ must be at least 1'

    const stock = Number(form.stock)
    if (form.stock === '' || Number.isNaN(stock)) errs.stock = 'Enter available stock'
    else if (stock < 0) errs.stock = 'Stock cannot be negative'

    if (form.short_description.length > LIMITS.short) errs.short_description = `Max ${LIMITS.short} characters`
    setErrors(errs)
    return errs
  }

  /* ---- image uploads ------------------------------------------------------ */
  const uploadOne = (entry, file) =>
    new Promise((resolve, reject) => {
      const fd = new FormData()
      fd.append('files', file)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/supplier/uploads`)
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token') || ''}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setForm((f) => ({ ...f, images: f.images.map((im) => (im.id === entry.id ? { ...im, progress: pct } : im)) }))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const saved = JSON.parse(xhr.responseText)[0]
          resolve(saved.url)
        } else {
          let detail = 'Upload failed'
          try { detail = JSON.parse(xhr.responseText).detail || detail } catch { /* noop */ }
          reject(new Error(detail))
        }
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(fd)
    })

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    const accepted = []
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" — only JPG, PNG or WebP images are allowed`)
        continue
      }
      if (file.size > MAX_BYTES) {
        toast.error(`"${file.name}" is over the 5MB limit`)
        continue
      }
      accepted.push(file)
    }
    for (const file of accepted) {
      const entry = { id: `${file.name}-${Date.now()}-${Math.random()}`, url: null, name: file.name, progress: 0 }
      setForm((f) => ({ ...f, images: [...f.images, entry] }))
      try {
        const url = await uploadOne(entry, file)
        setForm((f) => ({
          ...f,
          images: f.images.map((im) => (im.id === entry.id ? { ...im, url, progress: 100 } : im)),
        }))
      } catch (err) {
        toast.error(err.message)
        setForm((f) => ({ ...f, images: f.images.filter((im) => im.id !== entry.id) }))
      }
    }
  }

  const removeImage = (imageId) => setForm((f) => ({ ...f, images: f.images.filter((im) => im.id !== imageId) }))
  const makeMain = (imageId) =>
    setForm((f) => {
      const idx = f.images.findIndex((im) => im.id === imageId)
      if (idx <= 0) return f
      const images = [...f.images]
      const [picked] = images.splice(idx, 1)
      return { ...f, images: [picked, ...images] }
    })

  /* ---- tags ---------------------------------------------------------------- */
  const addTag = () => {
    const t = tagInput.trim().replace(/,/g, '')
    if (!t) return
    if (form.tags.includes(t)) { setTagInput(''); return }
    if (form.tags.length >= 10) { toast.error('Up to 10 tags per product'); return }
    set({ tags: [...form.tags, t] })
    setTagInput('')
  }

  /* ---- submit ---------------------------------------------------------------- */
  const submit = async (asDraft) => {
    const errs = validate(asDraft)
    if (Object.keys(errs).length) {
      setShakeKey((k) => k + 1)
      const firstId = SECTIONS.find((s) => {
        const el = document.getElementById(s.id)
        return el && el.querySelector('.text-rose-500')
      })?.id
      if (firstId) document.getElementById(firstId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/api/supplier/products/${id}`, formToPayload(form, asDraft))
        // Editing a live (approved) product re-flags it for admin review — tell
        // the supplier why their product shows "pending approval" again.
        if (!asDraft && original?.is_approved) {
          toast.success('Saved — sent for review (edits to live products are re-checked)', { duration: 4500 })
          navigate('/supplier/products')
          setSaving(false)
          return
        }
        toast.success(asDraft ? 'Saved as draft' : 'Product updated — sent for review')
      } else {
        await api.post('/api/supplier/products', formToPayload(form, asDraft))
        toast.success(asDraft ? 'Draft saved' : 'Product submitted for review!')
        clearDraft()
      }
      navigate('/supplier/products')
    } catch (err) {
      toast.error(extractError(err, 'Could not save product'))
      // Surface pydantic-style field errors inline when available.
      const detail = err?.response?.data?.detail
      if (Array.isArray(detail)) {
        const mapped = {}
        detail.forEach((d) => { if (d.loc?.length) mapped[d.loc[d.loc.length - 1]] = d.msg })
        setErrors((e) => ({ ...e, ...mapped }))
      }
    } finally {
      setSaving(false)
    }
  }

  /* ---- loading skeleton --------------------------------------------------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="shimmer h-8 w-56 rounded-lg" />
        <div className="card space-y-4 p-6">
          {[0, 1, 2, 3].map((i) => <div key={i} className="shimmer h-12 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  const mainImage = form.images.find((im) => im.url) || null

  return (
    <div className="mx-auto max-w-6xl">
      {/* ---- header ---- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/supplier/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-indigo-600">
            <FiArrowLeft size={13} /> Back to My Products
          </Link>
          <h1 className="mt-1 flex items-center gap-2 font-space text-2xl font-bold tracking-tight text-ink">
            {isEdit ? <><FiEdit3 className="text-indigo-500" /> Edit product</> : <><FiPlus className="text-indigo-500" /> Add new product</>}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Listings are reviewed by TradeNest admins before going live to buyers.
          </p>
        </div>
        {original && <StatusBadge status={!original.is_approved ? 'pending approval' : original.is_active ? 'active' : 'inactive'} pulse={!original.is_approved} />}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* ==================== FORM COLUMN ==================== */}
        <div>
          {/* sticky section nav (table-of-contents) */}
          <div className="sticky top-32 z-20 -mx-1 mb-4 flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/70 bg-white/85 px-2 py-2 backdrop-blur-xl">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                  activeSection === s.id ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {activeSection === s.id && !reduceMotion && (
                  <motion.span layoutId="form-toc-pill" className="absolute inset-0 -z-10 rounded-lg bg-indigo-50" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                {s.icon} {s.label}
              </button>
            ))}
            <span className="ml-auto inline-flex items-center gap-2 pr-2 text-[11px] font-bold text-slate-400">
              <span className="hidden sm:inline">{completion}% complete</span>
              <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                <motion.span
                  className={`absolute inset-y-0 left-0 rounded-full ${completion === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  animate={{ width: `${completion}%` }}
                  transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                />
              </span>
            </span>
          </div>

          <Shake trigger={shakeKey}>
            <div className="space-y-5">
              {/* ================= 1. BASIC INFO ================= */}
              <section id="basic" className="card space-y-4 p-6">
                <h2 className="flex items-center gap-2 font-space text-base font-bold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-extrabold text-indigo-700">1</span>
                  Basic Information
                </h2>

                <Field id="f-title" label="Product title" required error={errors.name} counter={{ len: form.name.length, max: LIMITS.title }}>
                  <FloatingInput
                    label="e.g. Bulk braided USB-C cables"
                    value={form.name}
                    maxLength={LIMITS.title + 20}
                    onChange={(e) => set({ name: e.target.value })}
                    error={errors.name}
                    valid={form.name.trim().length >= 3}
                    inputClass={errors.name ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100/60'}
                  />
                </Field>

                <Field
                  id="f-category" label="Category" hint="Helps buyers find your product in the marketplace."
                >
                  <select
                    value={form.category_id}
                    onChange={(e) => set({ category_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-ink outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60"
                  >
                    <option value="">Select a category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                    ))}
                  </select>
                </Field>

                <Field
                  id="f-short" label="Short description" error={errors.short_description}
                  hint="Optional one-liner shown on product cards." counter={{ len: form.short_description.length, max: LIMITS.short }}
                >
                  <FloatingInput
                    label="One-line summary for product cards"
                    value={form.short_description}
                    maxLength={LIMITS.short + 20}
                    onChange={(e) => set({ short_description: e.target.value })}
                    error={errors.short_description}
                    valid={form.short_description.trim().length > 0 && form.short_description.length <= LIMITS.short}
                    counter={{ text: `${form.short_description.length}/${LIMITS.short}`, cls: counterClass(form.short_description.length, LIMITS.short) }}
                    inputClass={errors.short_description ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100/60'}
                  />
                </Field>
              </section>

              {/* ================= 2. DESCRIPTION ================= */}
              <section id="description" className="card space-y-3 p-6">
                <h2 className="flex items-center gap-2 font-space text-base font-bold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-extrabold text-indigo-700">2</span>
                  Detailed Description
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">Buyers read this first</span>
                </h2>

                <motion.textarea
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  rows={9}
                  placeholder="Describe your product's features, materials, specifications, and packaging to help buyers make informed decisions…"
                  className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:italic placeholder:text-slate-300 focus:ring-4 ${
                    errors.description ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100/60'
                  } ${descLen >= LIMITS.descriptionMin ? 'focus:ring-emerald-100/60' : ''}`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className={`font-bold ${counterClass(descLen, LIMITS.description)}`}>{descLen}/{LIMITS.description} characters</span>
                    <span>{descWords} words</span>
                    {descLen < LIMITS.descriptionMin && descLen > 0 && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold text-amber-500">
                        {LIMITS.descriptionMin - descLen} more needed
                      </motion.span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-slate-300"><FiInfo size={11} /> materials · specs · packaging · certifications</span>
                </div>
                <AnimatePresence>
                  {errors.description && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 text-xs font-semibold text-rose-500">
                      <FiAlertCircle size={12} /> {errors.description}
                    </motion.p>
                  )}
                </AnimatePresence>
              </section>

              {/* ================= 3. PRICING ================= */}
              <section id="pricing" className="card space-y-4 p-6">
                <h2 className="flex items-center gap-2 font-space text-base font-bold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-extrabold text-indigo-700">3</span>
                  Pricing &amp; Order Details
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field id="f-price" label="Price per unit ($)" required error={errors.price}>
                    <FloatingInput
                      type="number" step="0.01" min="0" label="0.00"
                      value={form.price} onChange={(e) => set({ price: e.target.value })} error={errors.price}
                      valid={Number(form.price) > 0}
                      inputClass={errors.price ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100/60'}
                    />
                  </Field>

                  <Field id="f-unit" label="Unit type">
                    <select
                      value={form.unit}
                      onChange={(e) => set({ unit: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold capitalize text-ink outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60"
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>

                  <Field id="f-moq" label="MOQ" required error={errors.moq}
                    hint={(
                      <span className="inline-flex items-center gap-1">
                        <FiInfo size={11} className="text-slate-400" /> Minimum Order Quantity — the smallest amount a buyer can order at once.
                      </span>
                    )}
                  >
                    <FloatingInput
                      type="number" min="1" label="e.g. 50"
                      value={form.moq} onChange={(e) => set({ moq: e.target.value })} error={errors.moq}
                      valid={Number(form.moq) >= 1}
                      inputClass={errors.moq ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100/60'}
                    />
                  </Field>
                </div>

                <Field id="f-stock" label="Available stock" required error={errors.stock}>
                  <FloatingInput
                    type="number" min="0" label="Units available now"
                    value={form.stock} onChange={(e) => set({ stock: e.target.value })} error={errors.stock}
                    valid={form.stock !== '' && Number(form.stock) >= 0}
                    inputClass={errors.stock ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100/60'}
                  />
                </Field>

                {/* live-calculated minimum order value */}
                <AnimatePresence mode="popLayout">
                  {minOrderValue > 0 && (
                    <motion.div
                      key={minOrderValue}
                      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                        <FiShoppingBag size={13} /> Minimum order value
                      </span>
                      <AnimatedCounter value={minOrderValue} prefix="$" decimals={2} className="font-space text-lg font-extrabold text-emerald-700" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* ================= 4. IMAGES ================= */}
              <section id="images" className="card space-y-4 p-6">
                <h2 className="flex items-center gap-2 font-space text-base font-bold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-extrabold text-indigo-700">4</span>
                  Product Images
                  <span className="text-xs font-medium text-slate-400">first image = main display</span>
                </h2>

                {/* drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                  onClick={() => document.getElementById('pform-image-input')?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
                    dragOver ? 'scale-[1.01] border-indigo-400 bg-indigo-50/80 shadow-lg shadow-indigo-100' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <motion.span
                    animate={dragOver && !reduceMotion ? { y: [0, -5, 0] } : {}}
                    transition={{ repeat: dragOver ? Infinity : 0, duration: 0.9 }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-500"
                  >
                    <FiUploadCloud size={22} />
                  </motion.span>
                  <p className="mt-3 text-sm font-bold text-slate-600">Drag &amp; drop images here, or click to browse</p>
                  <p className="mt-0.5 text-xs text-slate-400">JPG, PNG or WebP · up to 5MB each · multiple images supported</p>
                </div>
                <input
                  id="pform-image-input" type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
                />

                {/* thumbnail grid */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    <AnimatePresence mode="popLayout">
                      {form.images.map((im, idx) => (
                        <motion.div
                          key={im.id} layout
                          initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7, transition: { duration: 0.18 } }}
                          className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-slate-100 ${
                            idx === 0 ? 'border-indigo-400' : 'border-transparent'
                          }`}
                        >
                          {im.url ? (
                            <img src={imageUrl(im.url)} alt={im.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <span className="shimmer h-full w-full" />
                            </div>
                          )}
                          {/* upload progress bar */}
                          {im.progress < 100 && (
                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/50 px-2 py-1.5 backdrop-blur-sm">
                              <div className="h-1 overflow-hidden rounded-full bg-white/30">
                                <motion.div className="h-full rounded-full bg-indigo-400" animate={{ width: `${im.progress}%` }} transition={{ duration: 0.2 }} />
                              </div>
                              <p className="mt-0.5 text-center text-[9px] font-bold text-white">{im.progress}%</p>
                            </div>
                          )}
                          {/* main badge */}
                          {idx === 0 && im.progress >= 100 && (
                            <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-extrabold text-white shadow">
                              <FiStar size={9} className="fill-white" /> MAIN
                            </span>
                          )}
                          {/* hover actions */}
                          {im.progress >= 100 && (
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/45 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                              {idx !== 0 && (
                                <button type="button" onClick={() => makeMain(im.id)} title="Set as main image"
                                  className="rounded-lg bg-white/95 p-2 text-indigo-600 shadow transition hover:scale-105 hover:text-indigo-700">
                                  <FiStar size={13} />
                                </button>
                              )}
                              <button type="button" onClick={() => removeImage(im.id)} title="Remove image"
                                className="rounded-lg bg-white/95 p-2 text-rose-500 shadow transition hover:scale-105 hover:text-rose-600">
                                <FiX size={13} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {/* ================= 5. TAGS ================= */}
              <section id="tags" className="card space-y-3 p-6">
                <h2 className="flex items-center gap-2 font-space text-base font-bold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-extrabold text-indigo-700">5</span>
                  Tags &amp; Keywords
                  <span className="text-xs font-medium text-slate-400">optional · improves search discovery</span>
                </h2>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100/60">
                  <AnimatePresence mode="popLayout">
                    {form.tags.map((t) => (
                      <motion.span
                        key={t} layout
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 py-1 pl-3 pr-1.5 text-xs font-bold text-indigo-700"
                      >
                        {t}
                        <button type="button" onClick={() => set({ tags: form.tags.filter((x) => x !== t) })}
                          className="rounded-full p-0.5 text-indigo-300 transition hover:bg-indigo-100 hover:text-indigo-600" aria-label={`Remove tag ${t}`}>
                          <FiX size={11} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
                      else if (e.key === 'Backspace' && !tagInput && form.tags.length) set({ tags: form.tags.slice(0, -1) })
                    }}
                    onBlur={addTag}
                    placeholder={form.tags.length ? '' : 'Type a keyword and press Enter…'}
                    className="min-w-[140px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-slate-300"
                  />
                </div>
                <p className="text-xs text-slate-400">{form.tags.length}/10 tags · e.g. “usb-c”, “braided”, “wholesale”</p>
              </section>

              {/* ================= 6. REVIEW ================= */}
              <section id="review" className="card space-y-4 p-6">
                <h2 className="flex items-center gap-2 font-space text-base font-bold text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-[11px] font-extrabold text-indigo-700">6</span>
                  Review &amp; Submit
                </h2>

                {/* compact summary of everything entered */}
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {[
                    ['Title', form.name || '—'],
                    ['Category', categories.find((c) => String(c.id) === String(form.category_id))?.name || '—'],
                    ['Price', form.price ? `$${Number(form.price).toFixed(2)} / ${form.unit}` : '—'],
                    ['MOQ', form.moq || '—'],
                    ['Stock', form.stock || '—'],
                    ['Images', `${form.images.filter((i) => i.url).length} uploaded`],
                    ['Tags', form.tags.length ? form.tags.join(', ') : '—'],
                    ['Description', `${descLen} chars`],
                    ['Min. order value', minOrderValue ? `$${minOrderValue.toFixed(2)}` : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
                      <p className="truncate text-sm font-bold text-ink" title={String(v)}>{v}</p>
                    </div>
                  ))}
                </div>

                {completion < 100 && (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                    <FiAlertCircle size={12} /> {100 - completion}% of the listing is incomplete — you can still save it as a draft.
                  </p>
                )}
              </section>
            </div>
          </Shake>
        </div>

        {/* ==================== PREVIEW COLUMN ==================== */}
        <div className="hidden xl:block">
          <div className="sticky top-32 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <FiRefreshCw size={11} /> Live buyer preview
            </p>

            {/* mini product card — mirrors the public ProductCard layout */}
            <motion.div layout className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                {mainImage?.url ? (
                  <motion.img key={mainImage.url} src={imageUrl(mainImage.url)} alt="Main product" className="h-full w-full object-cover"
                    initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-slate-300">
                    <FiImage size={26} />
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wide">No image yet</span>
                  </div>
                )}
                <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Verified
                </span>
              </div>
              <div className="p-3.5">
                <h3 className="truncate font-space text-sm font-bold text-ink">{form.name || 'Untitled product'}</h3>
                <p className="mt-0.5 line-clamp-2 min-h-[2rem] text-xs leading-5 text-slate-500">
                  {form.short_description || form.description?.slice(0, 120) || 'Short description appears here…'}
                </p>
                <div className="mt-2.5 flex items-end justify-between">
                  <div>
                    <div className="font-space text-lg font-bold text-indigo-600">
                      {form.price ? `$${Number(form.price).toFixed(2)}` : '$ —'}
                      <span className="ml-0.5 text-[10px] font-medium text-slate-400">/ {form.unit}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-slate-500">
                      <FiPackage size={10} /> MOQ {form.moq || '—'} <span className="text-slate-300">|</span> {form.stock || 0} in stock
                    </div>
                  </div>
                </div>
                {form.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.tags.slice(0, 4).map((t) => (
                      <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* what happens next */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 text-xs leading-5 text-indigo-900">
              <p className="font-bold">What happens on submit?</p>
              <p className="mt-1 text-indigo-700">
                Your listing enters the admin review queue with a <StatusBadge status="pending approval" /> badge.
                Once approved it goes live to buyers instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== STICKY ACTION BAR ==================== */}
      <div className="sticky bottom-4 z-30 mt-6">
        <motion.div
          initial={reduceMotion ? false : { y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-xl shadow-slate-200/60 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            {lastSaved && !isEdit ? (
              <motion.span key={lastSaved.getTime()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-1">
                <FiCheckCircle size={12} className="text-emerald-500" /> Draft saved {lastSaved.toLocaleTimeString()}
              </motion.span>
            ) : (
              <span className="inline-flex items-center gap-1"><FiEdit3 size={12} /> {isEdit ? 'Editing existing product' : 'Autosaves as you type'}</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button" disabled={saving} onClick={() => submit(true)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {saving ? <FiRefreshCw className="animate-spin" size={14} /> : 'Save as Draft'}
            </button>
            <motion.button
              type="button" disabled={saving} onClick={() => submit(false)}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200/60 transition hover:shadow-xl disabled:opacity-60"
            >
              {saving ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-flex">
                    <FiRefreshCw size={14} />
                  </motion.span>
                  {isEdit ? 'Saving…' : 'Submitting…'}
                </>
              ) : isEdit ? (
                <><FiCheckCircle size={15} /> Save changes</>
              ) : (
                <><FiCheckCircle size={15} /> Submit for Review</>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* restore-draft toast trigger (rendered via AnimatePresence for smoothness) */}
      <AnimatePresence>
        {draftRestored && null /* actual toast already fired on restore */}
      </AnimatePresence>
    </div>
  )
}
