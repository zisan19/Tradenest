import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FiSearch, FiShoppingBag, FiMenu, FiX, FiChevronDown, FiUser } from 'react-icons/fi'
import { AnimatePresence, motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { ROLE_LABELS, ROLES } from '../auth/roles'
import { useCart } from '../context/CartContext'

export default function Nav() {
  const { user, role, roleHome, logout } = useAuth()
  const { totalItems, toggleCart, cartBounce } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()

  // Live continuous scroll transforms
  const { scrollY } = useScroll()
  const navHeight = useTransform(scrollY, [0, 100], ['5rem', '3.85rem'])
  const navBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.88)']
  )
  const borderBottomColor = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255, 255, 255, 0.2)', 'rgba(226, 232, 240, 0.85)']
  )
  const shadow = useTransform(
    scrollY,
    [0, 100],
    ['0 0px 0px rgba(15, 23, 42, 0)', '0 12px 32px -8px rgba(15, 23, 42, 0.08)']
  )

  // Track hovered link for sliding pill indicator
  const [hoveredPath, setHoveredPath] = useState(null)

  const navLinks = [
    { label: 'Browse products', path: '/products' },
    ...(user
      ? [
          {
            label:
              role === ROLES.ADMIN
                ? 'Admin workspace'
                : role === ROLES.SUPPLIER
                ? 'Supplier workspace'
                : 'Dashboard',
            path: roleHome,
          },
        ]
      : []),
  ]

  return (
    <motion.nav
      style={{
        backgroundColor: shouldReduceMotion ? 'rgba(255,255,255,0.9)' : navBg,
        borderBottomColor: shouldReduceMotion ? '#e2e8f0' : borderBottomColor,
        boxShadow: shouldReduceMotion ? 'none' : shadow,
      }}
      className="sticky top-0 z-40 border-b backdrop-blur-xl transition-colors will-change-transform"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          style={{ height: shouldReduceMotion ? '4.5rem' : navHeight }}
          className="flex items-center justify-between gap-5 transition-[height] duration-150"
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="font-space text-2xl font-bold tracking-tight gradient-text relative group"
            >
              TradeNest<span className="text-accent">.</span>
            </Link>

            {/* Desktop Navigation Links with Animated Sliding Pill */}
            <div
              onMouseLeave={() => setHoveredPath(null)}
              className="hidden items-center gap-1 md:flex"
            >
              <Link
                to="/"
                onMouseEnter={() => setHoveredPath('/')}
                className={`relative px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  location.pathname === '/' ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Home
                {(hoveredPath === '/' || (hoveredPath === null && location.pathname === '/')) && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 -z-10 rounded-full bg-indigo-50/80 border border-indigo-100/60"
                  />
                )}
              </Link>

              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                const isHovered = hoveredPath === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onMouseEnter={() => setHoveredPath(link.path)}
                    className={`relative px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isActive ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {link.label}
                    {(isHovered || (hoveredPath === null && isActive)) && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="absolute inset-0 -z-10 rounded-full bg-indigo-50/80 border border-indigo-100/60"
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden max-w-sm flex-1 lg:block">
            <div className="relative group">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                size={17}
              />
              <input
                type="search"
                placeholder="Search products or suppliers..."
                className="w-full rounded-xl border border-slate-200/80 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100/60"
              />
            </div>
          </div>

          {/* User Auth & Actions */}
          <div className="flex items-center gap-3">
            {/* Cart Button with Bounce Animation & Dynamic Badge */}
            <motion.button
              id="nav-cart-btn"
              aria-label="Shopping cart"
              onClick={toggleCart}
              animate={
                cartBounce
                  ? { scale: [1, 1.32, 0.88, 1.18, 0.96, 1], rotate: [0, -12, 10, -6, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600 shadow-xs"
            >
              <FiShoppingBag size={18} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-extrabold text-white shadow-md ring-2 ring-white"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden text-right text-xs font-medium text-slate-600 lg:block">
                  <span className="block font-bold text-slate-900 truncate max-w-[150px]">
                    {user.full_name || user.email}
                  </span>
                  <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    {ROLE_LABELS[role] || role}
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={logout}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  Logout
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition sm:inline"
                >
                  Log in
                </Link>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/register"
                    className="gradient-button rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition inline-block"
                  >
                    Join free
                  </Link>
                </motion.div>
              </div>
            )}

            <button
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen((value) => !value)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 md:hidden"
            >
              {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>
        </motion.div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="grid gap-2 overflow-hidden border-t border-slate-200/70 py-4 md:hidden"
            >
              <Link
                onClick={() => setMobileOpen(false)}
                to="/"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                Home
              </Link>
              <Link
                onClick={() => setMobileOpen(false)}
                to="/products"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                Browse products
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false)
                  toggleCart()
                }}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-left w-full"
              >
                <span className="flex items-center gap-2">
                  <FiShoppingBag className="w-4 h-4 text-emerald-600" />
                  Wholesale Cart
                </span>
                {totalItems > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
              {user && (
                <Link
                  onClick={() => setMobileOpen(false)}
                  to={roleHome}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {role === ROLES.ADMIN
                    ? 'Admin workspace'
                    : role === ROLES.SUPPLIER
                    ? 'Supplier workspace'
                    : 'Dashboard'}
                </Link>
              )}
              {!user && (
                <Link
                  onClick={() => setMobileOpen(false)}
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  Log in
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
