import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiLogOut, FiMenu } from 'react-icons/fi' //feather icon pack
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../auth/roles'

/**
 * DashboardLayout — shared internal shell for the supplier and admin
 * dashboards: fixed collapsible sidebar (slide-in drawer on mobile),
 * top bar with avatar + role badge + logout, animated active indicator
 * shared via layoutId between nav items.
 */
export default function DashboardLayout({ navItems, brandLabel, brandAccent = 'indigo', children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [sidebarOpen, setSidebarOpen] = useState(false) // mobile drawer
  const [collapsed, setCollapsed] = useState(false) // desktop collapse
  const location = useLocation()

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const accentMap = {
    indigo: { activeText: 'text-indigo-700', pill: 'bg-indigo-50/90 border-indigo-100/70', logo: 'from-indigo-600 to-violet-600' },
    violet: { activeText: 'text-violet-700', pill: 'bg-violet-50/90 border-violet-100/70', logo: 'from-violet-600 to-fuchsia-600' },
  }
  const a = accentMap[brandAccent] || accentMap.indigo

  const NavLinkItem = ({ item }) => {
    // The sidebar badge can be a number or a promise-based value via item.badge
    const badge = typeof item.badge === 'function' ? null : item.badge
    return (
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
            isActive ? `${a.activeText} font-bold` : 'text-slate-500 hover:text-slate-900'
          } ${collapsed ? 'justify-center' : ''}`  
        }
      >
        {({ isActive }) => (
          <>
            {(isActive) && (
              <motion.span
                layoutId={`dash-active-pill-${brandAccent}`}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`absolute inset-0 -z-10 rounded-xl border ${a.pill}`}
              />
            )}
            <span className="shrink-0 text-lg leading-none">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && badge > 0 && (
              <motion.span
                initial={reduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white shadow-sm"
              >
                {badge}
              </motion.span>
            )}
            {!collapsed && badge > 0 && !reduceMotion && (
              <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl ring-2 ring-rose-200/0 animate-pulse" />
            )}
          </>
        )}
      </NavLink>
      )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-mesh-background" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white/90 pt-20 backdrop-blur-xl transition-transform lg:sticky lg:top-16 lg:z-auto lg:translate-x-0 lg:self-start ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className={`flex items-center gap-2.5 px-4 pb-4 ${collapsed ? 'justify-center' : ''}`}>
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${a.logo} font-space text-sm font-bold text-white shadow-md`}>
            {brandLabel.charAt(0)}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-space text-sm font-bold text-ink">{brandLabel}</p>
              <p className="text-[11px] font-medium text-slate-400">TradeNest internal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => (
            <NavLinkItem key={item.to} item={item} />
          ))}
        </nav>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden items-center gap-2 border-t border-slate-100 px-4 py-3.5 text-xs font-bold text-slate-400 transition hover:text-indigo-600 lg:flex"
        >
          <span className="text-base leading-none">{collapsed ? '»' : '«'}</span>
          {!collapsed && 'Collapse sidebar'}
        </button>
      </motion.aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="sticky top-16 z-30 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 lg:hidden"
            aria-label="Open menu"
          >
            <FiMenu size={18} />
          </button>
          <div className="hidden min-w-0 flex-1 lg:block" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[180px] truncate text-xs font-bold text-slate-900">{user?.full_name || user?.email}</p>
              <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md">
              {(user?.full_name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <motion.button
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <FiLogOut size={13} /> Logout
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
