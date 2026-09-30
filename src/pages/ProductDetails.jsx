import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import {
  FiArrowLeft,
  FiCheckCircle,
  FiMapPin,
  FiMinus,
  FiPackage,
  FiPlus,
  FiShield,
  FiShoppingBag,
  FiZap,
  FiAlertCircle
} from 'react-icons/fi'
import { motion } from 'framer-motion'
import { ShimmerBox } from '../components/SkeletonLoader'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, openCart } = useCart()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const addToCartBtnRef = useRef(null)

  useEffect(() => {
    api
      .get(`/api/products/${id}`)
      .then((r) => {
        setProduct(r.data)
        setQuantity(r.data.moq || 1)
      })
      .catch(() => setError(true))
  }, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 text-xl font-bold">
          !
        </div>
        <h1 className="mt-5 font-space text-2xl font-bold text-slate-900">Product unavailable</h1>
        <p className="mt-2 text-sm text-slate-500">This listing could not be loaded right now.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition"
        >
          Back to products
        </Link>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2">
          <ShimmerBox className="h-96 w-full rounded-2xl" />
          <div className="space-y-4">
            <ShimmerBox className="h-6 w-36 rounded-lg" />
            <ShimmerBox className="h-10 w-4/5 rounded-lg" />
            <ShimmerBox className="h-24 w-full rounded-xl" />
            <ShimmerBox className="h-12 w-48 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const moq = product.moq || 1
  const stock = product.stock || 9999
  const isAtMoq = quantity <= moq
  const isAtStock = quantity >= stock
  const totalPrice = (Number(product.price) * quantity).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const handleDecrease = () => {
    if (quantity > moq) {
      setQuantity((prev) => prev - 1)
    } else {
      toast.error(`Minimum order quantity (MOQ) is ${moq} units.`)
    }
  }

  const handleIncrease = () => {
    if (quantity < stock) {
      setQuantity((prev) => prev + 1)
    } else {
      toast.error(`Maximum available stock is ${stock} units.`)
    }
  }

  const handleAddToCart = async () => {
    setAdding(true)
    const rect = addToCartBtnRef.current?.getBoundingClientRect()
    const success = await addItem(product, quantity, rect)
    if (success) {
      toast.success(`Added ${quantity} units to cart!`)
    }
    setAdding(false)
  }

  const handleBuyNow = async () => {
    setAdding(true)
    const success = await addItem(product, quantity)
    setAdding(false)
    if (success) {
      navigate('/checkout')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <FiArrowLeft /> Back to marketplace
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm group">
            <img
              src={product.image_url || '/placeholder.png'}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800'
              }}
            />
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm border border-white/60">
              <FiCheckCircle /> Verified Wholesale
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border-2 border-emerald-500 p-1 overflow-hidden">
              <img
                src={product.image_url || '/placeholder.png'}
                alt="Product preview"
                className="aspect-square w-full rounded-lg object-cover"
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">
              Factory Spec
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 font-medium">
              Compliance Doc
            </div>
          </div>
        </div>

        {/* Product Details & Ordering */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <FiCheckCircle /> Verified Supplier
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              Direct Bulk Pricing
            </span>
          </div>

          <h1 className="mt-4 font-space text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-slate-900">
            {product.name}
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-slate-600 text-sm">
            {product.description || 'Reliable wholesale supply for certified business buyers worldwide.'}
          </p>

          <div className="mt-6 flex items-end gap-3 border-b border-slate-200 pb-6">
            <span className="font-space text-4xl font-bold text-emerald-600">
              ${Number(product.price).toFixed(2)}
            </span>
            <span className="pb-1 text-sm font-medium text-slate-500">per wholesale unit</span>
          </div>

          <div className="grid grid-cols-2 gap-3 py-5">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <FiPackage className="text-indigo-600" />
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Minimum Order (MOQ)</p>
              <p className="mt-0.5 font-bold text-slate-800">{moq} units</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <FiShoppingBag className="text-emerald-600" />
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Available Stock</p>
              <p className="mt-0.5 font-bold text-slate-800">{stock} units</p>
            </div>
          </div>

          {/* Quantity and Action Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="quantity" className="text-sm font-bold text-slate-700">
                Order Quantity
              </label>
              <span className="text-xs font-medium text-slate-500">
                Total:{' '}
                <strong className="text-slate-800 text-sm">${totalPrice}</strong>
              </span>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-1.5 bg-slate-50/60">
              <button
                aria-label="Decrease quantity"
                onClick={handleDecrease}
                disabled={isAtMoq}
                className={`rounded-lg p-2.5 transition ${
                  isAtMoq
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-white hover:shadow-xs'
                }`}
                title={isAtMoq ? `Minimum order quantity is ${moq}` : 'Decrease'}
              >
                <FiMinus className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span id="quantity" className="font-space text-lg font-bold text-slate-800">
                  {quantity}
                </span>
                <span className="text-xs text-slate-400">units</span>
              </div>

              <button
                aria-label="Increase quantity"
                onClick={handleIncrease}
                disabled={isAtStock}
                className={`rounded-lg p-2.5 transition ${
                  isAtStock
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-white hover:shadow-xs'
                }`}
                title={isAtStock ? `Max inventory is ${stock}` : 'Increase'}
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            {isAtMoq && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Minimum wholesale purchase is {moq} units.
              </p>
            )}

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <motion.button
                ref={addToCartBtnRef}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full py-3.5 px-4 rounded-xl border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <FiShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBuyNow}
                disabled={adding}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <FiZap className="w-4 h-4" />
                <span>Buy Now</span>
              </motion.button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4 border-t border-slate-200 pt-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <FiShield className="text-emerald-500 w-4 h-4" /> Protected Transaction
            </span>
            <span className="flex items-center gap-1.5">
              <FiMapPin className="text-indigo-500 w-4 h-4" /> Worldwide Freight
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
