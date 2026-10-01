import React, { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiLayers, FiPackage, FiPieChart, FiShoppingBag, FiTag, FiUsers } from 'react-icons/fi'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import api from '../api/axios'
import AdminOverview from './admin/AdminOverview'
import AdminUsers from './admin/AdminUsers'
import AdminApprovals from './admin/AdminApprovals'
import AdminCategories from './admin/AdminCategories'
import AdminOrders from './admin/AdminOrders'
import AdminAnalytics from './admin/AdminAnalytics'
import { useAuth } from '../context/AuthContext'

/**
 * Admin dashboard shell — sidebar navigation + nested routes. The Approval
 * Queue nav item shows a pulsing badge with the number of pending suppliers
 * + products awaiting review (refetched whenever approvals change).
 */
export default function AdminDashboard() {
  const { user } = useAuth()
  const [pending, setPending] = useState({ suppliers: 0, products: 0 })

  const refreshPending = useCallback(() => {
    Promise.all([api.get('/api/admin/suppliers/pending'), api.get('/api/admin/products/pending')])
      .then(([s, p]) => setPending({ suppliers: s.data.length, products: p.data.length }))
      .catch(() => setPending({ suppliers: 0, products: 0 }))
  }, [])
  useEffect(() => {
    refreshPending()
  }, [refreshPending])

  const navItems = [
    { to: '/admin', end: true, label: 'Overview', icon: <FiLayers /> },
    { to: '/admin/users', label: 'Users', icon: <FiUsers /> },
    {
      to: '/admin/approvals',
      label: 'Approvals',
      icon: <FiPackage />,
      badge: pending.suppliers + pending.products,
    },
    { to: '/admin/categories', label: 'Categories', icon: <FiTag /> },
    { to: '/admin/orders', label: 'Orders', icon: <FiShoppingBag /> },
    { to: '/admin/analytics', label: 'Analytics', icon: <FiPieChart /> },
  ]

  return (
    <DashboardLayout brandLabel="Admin Console" brandAccent="violet" navItems={navItems}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes>
          <Route index element={<AdminOverview pendingCounts={pending} />} />
          <Route path="users" element={<AdminUsers currentAdminId={user?.id} />} />
          <Route path="approvals" element={<AdminApprovals onChanged={refreshPending} />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="*" element={<AdminOverview pendingCounts={pending} />} />
        </Routes>
      </motion.div>
    </DashboardLayout>
  )
}
