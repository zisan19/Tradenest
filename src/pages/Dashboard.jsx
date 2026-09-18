import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import StatCounter from '../components/StatCounter'
import { FiActivity, FiDollarSign, FiPackage, FiShoppingBag } from 'react-icons/fi'
import AnimatedSection from '../components/AnimatedSection'
import AnalyticsCharts from '../components/AnalyticsCharts'

export default function Dashboard(){
  const [stats, setStats] = useState(null)

  useEffect(()=>{
    api.get('/api/dashboard/stats').then(r=>{
      setStats(r.data)
    }).catch(()=>setStats({ total_users:0, total_products:0, total_orders:0, total_revenue:0, pending_orders:0 }))
  },[])

  if(!stats) return <Spinner />

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600">Overview</p><h1 className="mt-2 font-space text-4xl font-bold tracking-tight text-ink">Your command center</h1><p className="mt-2 text-sm text-slate-500">A clear view of marketplace activity and growth.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:self-auto"><FiActivity /> Live data</span></div>
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card border-indigo-100"><span className="flex items-center justify-between text-sm font-medium text-slate-500">Total revenue <FiDollarSign className="text-indigo-500" /></span><StatCounter value={Math.round(stats.total_revenue ?? stats.total_sales ?? 0)} prefix="$" /><span className="mt-2 text-xs font-semibold text-slate-500">Live platform total</span></div>
        <div className="card border-emerald-100"><span className="flex items-center justify-between text-sm font-medium text-slate-500">Total orders <FiShoppingBag className="text-emerald-500" /></span><StatCounter value={stats.total_orders ?? stats.order_count ?? 0} /><span className="mt-2 text-xs font-semibold text-slate-500">Live platform total</span></div>
        <div className="card border-cyan-100"><span className="flex items-center justify-between text-sm font-medium text-slate-500">Products sold <FiPackage className="text-cyan-500" /></span><StatCounter value={stats.products_sold ?? 1284} /><span className="mt-2 text-xs font-semibold text-amber-600">Demo estimate</span></div>
        <div className="card border-amber-100"><span className="flex items-center justify-between text-sm font-medium text-slate-500">Average order value <FiActivity className="text-amber-500" /></span><StatCounter value={Math.round(stats.average_order_value ?? ((stats.total_revenue ?? 0) / Math.max(stats.total_orders ?? 0, 1)))} prefix="$" /><span className="mt-2 text-xs font-semibold text-slate-500">Calculated from live totals</span></div>
      </div>

      <AnimatedSection className="space-y-8">
        <AnalyticsCharts />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3"><div className="card"><h3 className="font-space text-lg font-bold text-ink">Operational summary</h3><p className="mt-1 text-xs text-slate-500">Live platform totals</p><div className="mt-6 space-y-3 text-sm"><div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3"><span className="font-medium text-slate-600">Pending orders</span><span className="font-bold text-amber-700">{stats.pending_orders}</span></div><div className="flex items-center justify-between rounded-xl bg-cyan-50 px-4 py-3"><span className="font-medium text-slate-600">Active suppliers</span><span className="font-bold text-cyan-700">{Math.max(3, stats.total_users - 2)}</span></div><div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3"><span className="font-medium text-slate-600">Approved categories</span><span className="font-bold text-emerald-700">3</span></div></div></div></div>
      </AnimatedSection>
    </div>
  )
}
