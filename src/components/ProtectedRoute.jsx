import React from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccessRole, normalizeRole, ROLE_HOME } from '../auth/roles'

function AuthLoading(){
  return <div className="flex min-h-[50vh] items-center justify-center px-4"><div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" /><p className="mt-4 text-sm font-medium text-slate-500">Checking your TradeNest session...</p></div></div>
}

function Unauthorized(){
  const { user } = useAuth()
  const fallback = ROLE_HOME[normalizeRole(user?.role)] || '/dashboard'
  return <div className="mx-auto max-w-lg px-4 py-20 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 font-space text-xl font-bold text-amber-600">403</div><h1 className="mt-5 font-space text-2xl font-bold text-ink">You do not have access to this area</h1><p className="mt-2 text-sm leading-6 text-slate-500">Your current role cannot open this workspace. Use your role dashboard to continue.</p><NavigateButton to={fallback} /></div>
}

function NavigateButton({ to }){
  return <Link to={to} className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-indigo-700">Go to my dashboard</Link>
}

export default function ProtectedRoute({ children, roles = [] }){
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!canAccessRole(user, roles)) return <Unauthorized />
  return children
}
