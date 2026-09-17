import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ProductList from './pages/ProductList'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import SupplierDashboard from './pages/SupplierDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'
import Nav from './components/Nav'
import Footer from './components/Footer'
import CartDrawer from './components/cart/CartDrawer'
import FlyToCartAnimation from './components/cart/FlyToCartAnimation'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import PageTransition from './components/PageTransition'
import ProtectedRoute from './components/ProtectedRoute'
import { ROLES } from './auth/roles'

export default function App() {
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col font-poppins bg-bg text-secondary">
            <Nav />
            <CartDrawer />
            <FlyToCartAnimation />
            <main className="flex-1 overflow-x-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <PageTransition>
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/products/:id" element={<ProductDetails />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute roles={[ROLES.RETAILER]}>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/supplier"
                      element={
                        <ProtectedRoute roles={[ROLES.SUPPLIER]}>
                          <SupplierDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageTransition>
              </AnimatePresence>
            </main>
            <Footer />
            <Toaster position="top-right" />
          </div>
        </CartProvider>
      </AuthProvider>
    </MotionConfig>
  )
}
