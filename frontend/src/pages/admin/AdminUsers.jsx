import React, { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiAlertCircle, FiRefreshCw, FiUsers } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ConfirmModal from '../../components/dashboard/ConfirmModal'
import { extractError } from '../../components/dashboard/api'

/**
 * Admin "User Management" tab — searchable/sortable user table with role
 * badges, animated active/suspended switch (animated confirmation before
 * suspending) and role editing.
 */
export default function AdminUsers({ currentAdminId }) {
  const reduceMotion = useReducedMotion()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [suspendTarget, setSuspendTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    if (roleFilter) params.set('role', roleFilter)
    if (statusFilter) params.set('status', statusFilter)
    api
      .get(`/api/admin/users?${params.toString()}`)
      .then((res) => setUsers(res.data))
      .catch((err) => setError(extractError(err, 'Could not load users')))
      .finally(() => setLoading(false))
  }, [roleFilter, statusFilter])

  useEffect(load, [load, reloadKey])

  const setUserActive = async (user, isActive) => {
    setBusy(true)
    try {
      const res = await api.patch(`/api/admin/users/${user.id}/status`, { is_active: isActive })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)))
      toast.success(isActive ? `${user.full_name || user.email} re-activated` : `${user.full_name || user.email} suspended`)
    } catch (err) {
      toast.error(extractError(err, 'Status change failed'))
    } finally {
      setBusy(false)
      setSuspendTarget(null)
    }
  }

  const changeRole = async (user, role) => {
    try {
      const res = await api.patch(`/api/admin/users/${user.id}/role`, { role })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)))
      toast.success(`Role updated to ${role}`)
    } catch (err) {
      toast.error(extractError(err, 'Role change failed'))
    }
  }

  // Animated switch component (shared style, local component)
  const StatusSwitch = ({ user }) => {
    const active = user.is_active
    return (
      <button
        onClick={() => (active ? setSuspendTarget(user) : setUserActive(user, true))}
        disabled={busy || user.id === currentAdminId}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40"
        style={{ backgroundColor: active ? '#10b981' : '#e2e8f0' }}
        aria-label={active ? 'Suspend user' : 'Activate user'}
        title={user.id === currentAdminId ? 'You cannot suspend your own account' : undefined}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className="mx-0.5 h-5 w-5 rounded-full bg-white shadow-md"
          style={{ marginLeft: active ? 'auto' : '2px' }}
        />
      </button>
    )
  }

  const columns = [
    {
      key: 'full_name',
      header: 'User',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
            {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-800">{u.full_name || '—'}</p>
            <p className="truncate text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) =>
        u.id === currentAdminId ? (
          <StatusBadge status={u.role} />
        ) : (
          <select
            value={u.role}
            onChange={(e) => changeRole(u, e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400"
          >
            <option value="buyer">Retailer</option>
            <option value="supplier">Supplier</option>
            <option value="admin">Admin</option>
          </select>
        ),
    },
    { key: 'is_verified', header: 'Verified', render: (u) => (u.is_verified ? <span className="text-xs font-bold text-emerald-600">Yes</span> : <span className="text-xs text-slate-400">No</span>) },
    {
      key: 'created_at',
      header: 'Joined',
      render: (u) => <span className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</span>,
      sortValue: (u) => new Date(u.created_at).getTime(),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <StatusSwitch user={u} />
          <StatusBadge status={u.is_active ? 'active' : 'suspended'} />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-space text-2xl font-bold tracking-tight text-ink">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">{users.length} registered account(s)</p>
      </div>

      {error && (
        <div className="card flex items-center justify-between border-rose-100">
          <span className="flex items-center gap-2 text-sm font-semibold text-rose-600"><FiAlertCircle /> {error}</span>
          <button onClick={load} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">Retry</button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        error={null}
        pageSize={8}
        emptyIcon={<FiUsers size={20} />}
        emptyTitle="No users found"
        emptyMessage="Try changing the role or status filters."
        toolbar={
          <>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400">
              <option value="">All roles</option>
              <option value="buyer">Retailers</option>
              <option value="supplier">Suppliers</option>
              <option value="admin">Admins</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-indigo-400">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button onClick={load} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50" aria-label="Refresh"><FiRefreshCw size={14} /></button>
          </>
        }
      />

      <ConfirmModal
        open={!!suspendTarget}
        danger
        busy={busy}
        title="Suspend this user?"
        message={`${suspendTarget?.full_name || suspendTarget?.email} will lose access immediately and all their sessions will be revoked. You can re-activate them anytime.`}
        confirmLabel="Suspend user"
        onCancel={() => setSuspendTarget(null)}
        onConfirm={() => setUserActive(suspendTarget, false)}
      />
    </div>
  )
}
