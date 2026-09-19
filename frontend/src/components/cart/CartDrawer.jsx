import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  FiX,
  FiShoppingBag,
  FiTrash2,
  FiPlus,
  FiMinus,
  FiArrowRight,
  FiShield,
  FiPackage,
  FiAlertCircle
} from 'react-icons/fi'
import { useCart } from '../../context/CartContext'

export default function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    totalItems,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
    loading
  } = useCart()

  const navigate = useNavigate()

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeCart])

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleProceedToCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[990] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={closeCart}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col z-10 border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <FiShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Bulk Order Cart
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                      {totalItems} {totalItems === 1 ? 'unit' : 'units'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    B2B Marketplace Verified Wholesale
                  </p>
                </div>
              </div>

              <button
                onClick={closeCart}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close cart drawer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mb-4 shadow-inner"
                  >
                    <FiPackage className="w-10 h-10 stroke-[1.5]" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Your wholesale cart is empty
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6">
                    Browse factory-direct verified listings and add products meeting wholesale minimum quantities.
                  </p>
                  <button
                    onClick={() => {
                      closeCart()
                      navigate('/marketplace')
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    Explore Marketplace <FiArrowRight />
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const product = item.product || {}
                    const price = item.price_snapshot || product.price || 0
                    const itemTotal = price * item.quantity
                    const moq = product.moq || 1
                    const stock = product.stock || 9999
                    const isAtMoq = item.quantity <= moq
                    const isAtStock = item.quantity >= stock

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -30, scale: 0.9 }}
                        transition={{ duration: 0.24 }}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex gap-3.5 relative group hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <img
                            src={product.image_url || '/placeholder.png'}
                            alt={product.title || 'Product image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300'
                            }}
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {product.title || 'Wholesale Item'}
                              </h4>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                                title="Remove item"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>${Number(price).toFixed(2)} / unit</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                MOQ: {moq}
                              </span>
                            </p>
                          </div>

                          {/* Stepper + Subtotal */}
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-xs">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={isAtMoq}
                                className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                                  isAtMoq
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title={isAtMoq ? `Minimum order is ${moq}` : 'Decrease quantity'}
                              >
                                <FiMinus className="w-3 h-3" />
                              </button>

                              <span className="w-8 text-center text-xs font-bold text-slate-800 dark:text-slate-100">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={isAtStock}
                                className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-colors ${
                                  isAtStock
                                    ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title={isAtStock ? `Max available stock reached` : 'Increase quantity'}
                              >
                                <FiPlus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Item Subtotal */}
                            <div className="text-right">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                ${Number(itemTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {isAtMoq && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                              <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
                              Wholesale MOQ constraint active ({moq} min)
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer Summary & Checkout CTA */}
            {items.length > 0 && (
              <div className="p-5 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Wholesale Subtotal</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      ${Number(subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                    <span className="flex items-center gap-1">
                      <FiShield className="w-3.5 h-3.5 text-emerald-500" /> Trade Assurance
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Included (Free)</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-base font-bold text-slate-900 dark:text-white">
                    <span>Estimated Total</span>
                    <span className="text-lg text-emerald-600 dark:text-emerald-400">
                      ${Number(subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleProceedToCheckout}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={clearCart}
                      className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      Clear entire cart
                    </button>
                    <button
                      onClick={closeCart}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
                    >
                      Continue browsing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
