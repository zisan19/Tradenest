import React, { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiCheckCircle, FiClock, FiMail, FiSave, FiUploadCloud, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { extractError } from '../../components/dashboard/api'

/**
 * Supplier "Store Settings" tab — company/contact details, store description,
 * logo upload, plus a read-only verification badge driven by the admin
 * approval workflow (is_verified / is_approved).
 */
export default function SupplierProfile() {
  const reduceMotion = useReducedMotion()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ company_name: '', full_name: '', contact_phone: '', store_description: '', logo_url: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get('/api/supplier/profile')
      .then((res) => {
        setProfile(res.data)
        setForm({
          company_name: res.data.company_name || '',
          full_name: res.data.full_name || '',
          contact_phone: res.data.contact_phone || '',
          store_description: res.data.store_description || '',
          logo_url: res.data.logo_url || '',
        })
      })
      .catch((err) => setError(extractError(err, 'Could not load profile')))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleLogoFile = (file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setForm((f) => ({ ...f, logo_url: url }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch('/api/supplier/profile', {
        company_name: form.company_name || null,
        full_name: form.full_name || null,
        contact_phone: form.contact_phone || null,
        store_description: form.store_description || null,
        logo_url: form.logo_url || null,
      })
      setProfile(res.data)
      toast.success('Store profile saved')
    } catch (err) {
      toast.error(extractError(err, 'Could not save profile'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card mx-auto max-w-2xl space-y-4 p-6">
        <div className="shimmer h-20 w-20 rounded-2xl" />
        <div className="shimmer h-10 w-full rounded-xl" />
        <div className="shimmer h-10 w-full rounded-xl" />
        <div className="shimmer h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (error) return <div className="card border-rose-100 p-8 text-center text-sm font-semibold text-rose-600">{error}</div>

  const verified = profile?.is_verified && profile?.is_approved

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-space text-2xl font-bold tracking-tight text-ink">Store Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Your public storefront identity on TradeNest.</p>
      </div>

      {/* Read-only verification status */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card flex items-center justify-between gap-3 ${verified ? 'border-emerald-100' : 'border-amber-100'}`}
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {verified ? <FiCheckCircle size={20} /> : <FiClock size={20} />}
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Verification status</p>
            <p className="text-xs text-slate-500">{verified ? 'Your store is verified by TradeNest admins.' : 'Awaiting admin approval — your listings are under review.'}</p>
          </div>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide ${verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {verified ? 'Verified' : 'Pending approval'}
        </span>
      </motion.div>

      <form onSubmit={handleSave} className="card space-y-4 p-6">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Store logo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300"><FiUser size={26} /></div>
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600">
            <FiUploadCloud size={15} /> Upload logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoFile(e.target.files?.[0])} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Company name</label>
            <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60" placeholder="Acme Supplies Ltd." />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Contact person</label>
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60" placeholder="Full name" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Contact phone</label>
          <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60" placeholder="+1-555-0100" />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Store description</label>
          <textarea value={form.store_description} onChange={(e) => setForm({ ...form, store_description: e.target.value })} rows={4} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60" placeholder="Tell retailers what you manufacture or wholesale…" />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="flex items-center gap-1.5 text-xs text-slate-400"><FiMail size={12} /> {profile?.email} (read-only)</p>
          <motion.button whileTap={reduceMotion ? undefined : { scale: 0.96 }} type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60">
            <FiSave size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </motion.button>
        </div>
      </form>
    </div>
  )
}
