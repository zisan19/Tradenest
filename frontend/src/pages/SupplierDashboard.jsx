import React, { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiGrid, FiPackage, FiPieChart, FiSettings, FiShoppingBag } from 'react-icons/fi'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import AccessDenied from '../components/dashboard/AccessDenied'
import api from '../api/axios'
import SupplierOverview from './supplier/SupplierOverview'
import SupplierProducts from './supplier/SupplierProducts'
import SupplierOrders from './supplier/SupplierOrders'
import SupplierAnalytics from './supplier/SupplierAnalytics'
import SupplierProfile from './supplier/SupplierProfile'
import ProductFormPage from './supplier/ProductFormPage'

const NAV_ITEMS = [
  { to: '/supplier', end: true, label: 'Overview', icon: <FiGrid /> },
  { to: '/supplier/products', label: 'My Products', icon: <FiPackage /> },
  { to: '/supplier/orders', label: 'Orders', icon: <FiShoppingBag /> },
  { to: '/supplier/analytics', label: 'Analytics', icon: <FiPieChart /> },
  { to: '/supplier/settings', label: 'Store Settings', icon: <FiSettings /> },
]

/**
 * Supplier dashboard shell — sidebar navigation + nested routes for the five
 * supplier tabs. Category list is fetched once and shared by the products
 * tab's filter and form.
 */
export default function SupplierDashboard() {
  const [categories, setCategories] = useState([])
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/api/categories')
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]))
  }, [])

  return (
    <DashboardLayout brandLabel="Supplier Hub" brandAccent="indigo" navItems={NAV_ITEMS}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes>
          <Route index element={<SupplierOverview onOpenOrder={(id) => navigate(`/supplier/orders?order=${id}`)} />} />
          <Route path="products" element={<SupplierProducts categories={categories} />} />
          {/* Full-page add/edit product form (nested under My Products). */}
          <Route path="products/new" element={<ProductFormPage categories={categories} />} />
          <Route path="products/:id/edit" element={<ProductFormPage categories={categories} />} />
          <Route path="orders" element={<SupplierOrders />} />
          <Route path="analytics" element={<SupplierAnalytics />} />
          <Route path="settings" element={<SupplierProfile />} />
          <Route path="*" element={<SupplierOverview />} />
        </Routes>
      </motion.div>
    </DashboardLayout>
  )
}
