import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiShield,
  FiLock,
  FiTruck,
  FiCreditCard,
  FiFileText,
  FiAlertCircle,
  FiPackage,
  FiTrash2,
  FiRefreshCw,
  FiInfo
} from 'react-icons/fi'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import AnimatedCreditCard from '../components/checkout/AnimatedCreditCard'
import ConfettiBurst from '../components/checkout/ConfettiBurst'
import ReceiptModal from '../components/checkout/ReceiptModal'

// Step definitions
const STEPS = [
  { id: 1, name: 'Review Order' },
  { id: 2, name: 'Shipping & Billing' },
  { id: 3, name: 'Demo Payment' },
  { id: 4, name: 'Confirmation' },
]

// Shipping methods
const SHIPPING_METHODS = [
  {
    id: 'standard',
    name: 'Standard Wholesale Freight',
    eta: '5-7 business days',
    price: 45.0,
    desc: 'Consolidated LCL container delivery with tracking',
  },
  {
    id: 'express',
    name: 'Express Air Cargo',
    eta: '2-3 business days',
    price: 120.0,
    desc: 'Priority air freight for urgent inventory replenishment',
  },
  {
    id: 'ocean',
    name: 'Ocean Container Freight',
    eta: '14-21 business days',
    price: 25.0,
    desc: 'Economical bulk maritime shipping for large volume orders',
  },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)

  // Shipping Form State
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.full_name || 'Alex Morgan',
    email: user?.email || 'alex.morgan@acmesupplies.com',
    companyName: 'Acme Global Supplies LLC',
    taxId: 'US-98745210',
    phone: '+1 (555) 389-2044',
    address: '100 Industrial Parkway, Suite 400',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60607',
    country: 'United States',
  })

  const [selectedShipping, setSelectedShipping] = useState(SHIPPING_METHODS[0])

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('card') // 'card', 'wire', 'lc'
  const [cardHolder, setCardHolder] = useState('Alex Morgan')
  const [cardNumber, setCardNumber] = useState('4242424242424242')
  const [expiry, setExpiry] = useState('12/28')
  const [cvc, setCvc] = useState('123')
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [simulateFailure, setSimulateFailure] = useState(false)

  // Processing & Confirmation State
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState('')
  const [paymentError, setPaymentError] = useState(null)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // Card Brand Detection
  const cardBrand = useMemo(() => {
    const raw = cardNumber.replace(/\D/g, '')
    if (raw.startsWith('4')) return 'visa'
    if (raw.startsWith('5')) return 'mastercard'
    if (raw.startsWith('34') || raw.startsWith('37')) return 'amex'
    return 'generic'
  }, [cardNumber])

  // Total calculation
  const totalAmount = useMemo(() => {
    return subtotal + selectedShipping.price
  }, [subtotal, selectedShipping])

  // Handlers for Preset Demo Cards
  const fillValidCard = () => {
    setCardNumber('4242424242424242')
    setCardHolder('Alex Morgan')
    setExpiry('12/28')
    setCvc('123')
    setSimulateFailure(false)
    setPaymentError(null)
    toast.success('Loaded Valid Demo Card (Visa)')
  }

  const fillFailingCard = () => {
    setCardNumber('4000000000000002')
    setCardHolder('Declined User')
    setExpiry('12/26')
    setCvc('000')
    setSimulateFailure(true)
    setPaymentError(null)
    toast.error('Loaded Failing Demo Card (Will decline)')
  }

  // Handle Card Number Input with auto 4-digit formatting
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16)
    setCardNumber(value)
  }

  // Handle Expiration Input (MM/YY)
  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`
    }
    setExpiry(value)
  }

  // Handle CVC Input
  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCvc(value)
  }

  // Step 1 Validation
  const handleProceedToShipping = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty.')
      return
    }
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 2 Validation
  const handleProceedToPayment = () => {
    if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.city) {
      toast.error('Please fill in required shipping fields.')
      return
    }
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 3 Payment Simulation Execution
  const handleAuthorizePayment = async () => {
    setPaymentError(null)

    // Basic Card Validation if using card
    if (paymentMethod === 'card') {
      const rawNum = cardNumber.replace(/\D/g, '')
      if (rawNum.length < 15) {
        setPaymentError('Invalid card number. Must be at least 15-16 digits.')
        return
      }
      if (!expiry || !expiry.includes('/')) {
        setPaymentError('Please enter a valid expiration date (MM/YY).')
        return
      }
      if (!cvc || cvc.length < 3) {
        setPaymentError('Please enter a valid 3-4 digit security CVC code.')
        return
      }
    }

    setIsProcessing(true)

    try {
      // Phased status updates for maximum realism
      setProcessingStage('Encrypting B2B credentials...')
      await new Promise((r) => setTimeout(r, 450))

      setProcessingStage('Connecting to TradeNest clearinghouse...')
      await new Promise((r) => setTimeout(r, 550))

      setProcessingStage('Authorizing simulated transaction...')

      // Generate a mock order ID
      const mockOrderId = Math.floor(100000 + Math.random() * 900000)

      // Call simulated payment endpoint
      const response = await api.post('/api/payments/simulate', {
        order_id: mockOrderId,
        amount: totalAmount,
        payment_method: paymentMethod === 'card' ? 'DEMO_CREDIT_CARD' : paymentMethod.toUpperCase(),
        simulate_failure: simulateFailure || cardNumber.endsWith('0002'),
      })

      const data = response.data

      if (data.status === 'SUCCESS') {
        const orderRecord = {
          orderId: mockOrderId,
          txnRef: data.transaction_ref,
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          buyerName: shippingInfo.fullName,
          companyName: shippingInfo.companyName,
          taxId: shippingInfo.taxId,
          address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.postalCode}`,
          country: shippingInfo.country,
          shippingMethod: selectedShipping.name,
          items: [...items],
          subtotal,
          shippingFee: selectedShipping.price,
          total: totalAmount,
          cardLast4: cardNumber.slice(-4) || '4242',
          paymentMethod:
            paymentMethod === 'card'
              ? `Demo Credit Card (${cardBrand.toUpperCase()})`
              : paymentMethod === 'wire'
              ? 'Simulated Wire Transfer'
              : 'Letter of Credit (L/C)',
        }

        setCompletedOrder(orderRecord)
        clearCart()
        setCurrentStep(4)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setPaymentError(
          data.error_message || 'Simulated payment declined by card network. (Demo Rejection State)'
        )
      }
    } catch (err) {
      console.error('Payment simulation error:', err)
      setPaymentError(
        err.response?.data?.detail ||
          'Simulated payment failed to connect to local mock endpoint. Please try again.'
      )
    } finally {
      setIsProcessing(false)
      setProcessingStage('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        orderData={completedOrder}
      />

      <div className="max-w-6xl mx-auto">
        {/* Academic Demo Disclaimer Header */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 p-4 sm:p-5 text-white shadow-lg border border-emerald-500/30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center font-bold text-lg flex-shrink-0">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">
                  Academic Course Project Demo
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                  NO REAL CHARGES
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Simulated B2B Checkout & Payment Flow. No actual financial gateways, cards, or bank accounts are linked.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <FiShield className="text-emerald-400 w-4 h-4" />
            <span>Simulated Escrow Sandbox</span>
          </div>
        </div>

        {/* Multi-Step Stepper Progress Bar */}
        <div className="mb-10 bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/80">
          <div className="relative flex items-center justify-between max-w-3xl mx-auto">
            {/* Background Connecting Line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />

            {/* Filled Progress Line */}
            <motion.div
              initial={false}
              animate={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 z-0"
              style={{ maxWidth: 'calc(100% - 3rem)' }}
            />

            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: isCurrent ? 1.15 : 1,
                      backgroundColor: isCompleted
                        ? '#10B981'
                        : isCurrent
                        ? '#059669'
                        : '#ffffff',
                      borderColor: isCompleted || isCurrent ? '#059669' : '#CBD5E1',
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 shadow-sm ${
                      isCompleted || isCurrent
                        ? 'text-white'
                        : 'text-slate-400 bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                      >
                        <FiCheck className="w-5 h-5 stroke-[2.5]" />
                      </motion.div>
                    ) : (
                      step.id
                    )}
                  </motion.div>
                  <span
                    className={`mt-2 text-xs font-semibold text-center whitespace-nowrap hidden sm:block ${
                      isCurrent
                        ? 'text-emerald-700 font-bold'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Content Layout: Wizard on Left + Sticky Order Summary on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* LEFT: STEP CONTENT */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {/* ========================================================= */}
              {/* STEP 1: REVIEW ORDER */}
              {/* ========================================================= */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">1. Review Wholesale Items</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Verify quantities, minimum order thresholds, and pricing before shipping.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {items.length} Products ({items.reduce((s, i) => s + i.quantity, 0)} Units)
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <FiPackage className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-base">Your cart is currently empty</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
                        Please add factory-verified wholesale products to your cart before proceeding with checkout.
                      </p>
                      <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                      >
                        Browse Marketplace <FiArrowRight />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => {
                        const product = item.product || {}
                        const price = item.price_snapshot || product.price || 0
                        const moq = product.moq || 1
                        const stock = product.stock || 9999
                        const lineTotal = price * item.quantity

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5">
                              <img
                                src={product.image_url || '/placeholder.png'}
                                alt={product.name}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300'
                                }}
                              />
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                  {product.name || product.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  ${Number(price).toFixed(2)} / unit •{' '}
                                  <span className="text-emerald-600 font-semibold">MOQ: {moq}</span>
                                </p>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                              {/* Quantity Stepper */}
                              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-2 py-1 shadow-xs">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= moq}
                                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs p-1"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-xs w-8 text-center text-slate-800">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={item.quantity >= stock}
                                  className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs p-1"
                                >
                                  +
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right min-w-[90px]">
                                <span className="block font-space font-bold text-sm text-slate-900">
                                  ${Number(lineTotal).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-[11px] text-slate-400 hover:text-red-500 transition"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                        <Link
                          to="/products"
                          className="text-xs font-semibold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition"
                        >
                          <FiArrowLeft /> Continue sourcing
                        </Link>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleProceedToShipping}
                          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
                        >
                          <span>Continue to Shipping</span>
                          <FiArrowRight />
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ========================================================= */}
              {/* STEP 2: SHIPPING & BILLING */}
              {/* ========================================================= */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">2. Shipping & Business Details</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Specify commercial consignee address and select preferred freight method.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Contact Full Name *</label>
                      <input
                        type="text"
                        value={shippingInfo.fullName}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, fullName: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="Alex Morgan"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Company / Entity Name *</label>
                      <input
                        type="text"
                        value={shippingInfo.companyName}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, companyName: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="Acme Global Supplies LLC"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Business Email *</label>
                      <input
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, email: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tax / VAT ID (Optional)</label>
                      <input
                        type="text"
                        value={shippingInfo.taxId}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, taxId: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="US-98745210"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Delivery Address *</label>
                      <input
                        type="text"
                        value={shippingInfo.address}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, address: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="100 Industrial Parkway, Suite 400"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={shippingInfo.city}
                        onChange={(e) =>
                          setShippingInfo({ ...shippingInfo, city: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">State / Prov *</label>
                        <input
                          type="text"
                          value={shippingInfo.state}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, state: e.target.value })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Postal Code *</label>
                        <input
                          type="text"
                          value={shippingInfo.postalCode}
                          onChange={(e) =>
                            setShippingInfo({ ...shippingInfo, postalCode: e.target.value })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Method Selection */}
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <FiTruck className="text-emerald-600" /> Select Freight Method
                    </h3>
                    <div className="space-y-2.5">
                      {SHIPPING_METHODS.map((method) => {
                        const isSelected = selectedShipping.id === method.id
                        return (
                          <div
                            key={method.id}
                            onClick={() => setSelectedShipping(method)}
                            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-600'
                                    : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-900">{method.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  {method.desc} • <span className="text-emerald-700 font-medium">ETA: {method.eta}</span>
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-xs text-slate-900">
                              ${method.price.toFixed(2)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Nav Actions */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                    >
                      <FiArrowLeft /> Back to Review
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProceedToPayment}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition"
                    >
                      <span>Proceed to Payment</span>
                      <FiArrowRight />
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ========================================================= */}
              {/* STEP 3: DEMO PAYMENT */}
              {/* ========================================================= */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          <FiCreditCard className="text-emerald-600" />
                          3. Simulated B2B Payment
                        </h2>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Demo Sandbox Mode
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Interactive payment experience with 3D card flip, quick test presets, and mock authorization.
                      </p>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border text-center transition ${
                          paymentMethod === 'card'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <FiCreditCard className="mx-auto mb-1 w-4 h-4" />
                        <span className="text-xs">Corporate Card</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('wire')}
                        className={`p-3 rounded-xl border text-center transition ${
                          paymentMethod === 'wire'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <FiRefreshCw className="mx-auto mb-1 w-4 h-4" />
                        <span className="text-xs">Wire Transfer</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('lc')}
                        className={`p-3 rounded-xl border text-center transition ${
                          paymentMethod === 'lc'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 font-bold'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <FiShield className="mx-auto mb-1 w-4 h-4" />
                        <span className="text-xs">Letter of Credit</span>
                      </button>
                    </div>

                    {paymentMethod === 'card' ? (
                      <div className="space-y-6">
                        {/* Interactive 3D Credit Card Visual */}
                        <div className="py-2">
                          <AnimatedCreditCard
                            cardNumber={cardNumber}
                            cardHolder={cardHolder}
                            expiry={expiry}
                            cvc={cvc}
                            isFlipped={isCardFlipped}
                            brand={cardBrand}
                          />
                        </div>

                        {/* Quick Demo Test Presets */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <FiInfo className="text-indigo-600" /> Demo Quick Fills:
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={fillValidCard}
                              className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition shadow-xs"
                            >
                              ✓ Fill Valid Card
                            </button>
                            <button
                              type="button"
                              onClick={fillFailingCard}
                              className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition shadow-xs"
                            >
                              ✕ Fill Failing Card
                            </button>
                          </div>
                        </div>

                        {/* Payment Error Alert with Shake */}
                        {paymentError && (
                          <motion.div
                            initial={{ x: -10 }}
                            animate={{ x: [0, -12, 12, -8, 8, -4, 4, 0] }}
                            transition={{ duration: 0.5 }}
                            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5"
                          >
                            <FiAlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                            <div>
                              <p className="font-bold">Payment Authorization Declined</p>
                              <p className="text-rose-700 mt-0.5">{paymentError}</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Card Input Fields */}
                        <div className="space-y-4 text-xs">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              value={cardHolder}
                              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                              className="w-full p-2.5 rounded-xl border border-slate-200 font-medium tracking-wide outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              placeholder="ALEX MORGAN"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              16-Digit Card Number
                            </label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-sm tracking-widest outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                              placeholder="4242 4242 4242 4242"
                              maxLength={16}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                Expiration Date
                              </label>
                              <input
                                type="text"
                                value={expiry}
                                onChange={handleExpiryChange}
                                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-sm tracking-wider outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                placeholder="MM/YY"
                                maxLength={5}
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                                <span>Security Code (CVC)</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  Flips card 3D
                                </span>
                              </label>
                              <input
                                type="password"
                                value={cvc}
                                onChange={handleCvcChange}
                                onFocus={() => setIsCardFlipped(true)}
                                onBlur={() => setIsCardFlipped(false)}
                                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-sm tracking-widest outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                placeholder="123"
                                maxLength={4}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : paymentMethod === 'wire' ? (
                      /* Simulated Wire Transfer Instructions */
                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <h4 className="font-bold text-slate-900 text-sm">
                          Simulated B2B Wire Transfer Instructions
                        </h4>
                        <p className="text-slate-600">
                          Transfer will be verified automatically in this academic demo.
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                          <p>
                            <span className="text-slate-400">Beneficiary Bank:</span> TradeNest Escrow Trust NA
                          </p>
                          <p>
                            <span className="text-slate-400">SWIFT / BIC:</span> TRADUS33XXX
                          </p>
                          <p>
                            <span className="text-slate-400">Account #:</span> 9820-4491-0023
                          </p>
                          <p>
                            <span className="text-slate-400">Reference:</span> ORDER-B2B-{Date.now().toString().slice(-6)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Simulated Letter of Credit */
                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        <h4 className="font-bold text-slate-900 text-sm">
                          Irrevocable Commercial Letter of Credit (L/C)
                        </h4>
                        <p className="text-slate-600">
                          Simulated documentary credit issued by buyer's advising bank. Full escrow protection guaranteed.
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                          <p>
                            <span className="text-slate-400">Issuing Bank:</span> Global Commercial Bank
                          </p>
                          <p>
                            <span className="text-slate-400">Credit Ref:</span> LC-TN-2026-9901
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Nav Actions */}
                    <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                      <button
                        onClick={() => setCurrentStep(2)}
                        disabled={isProcessing}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
                      >
                        <FiArrowLeft /> Back to Shipping
                      </button>

                      <motion.button
                        whileHover={!isProcessing ? { scale: 1.02 } : {}}
                        whileTap={!isProcessing ? { scale: 0.98 } : {}}
                        onClick={handleAuthorizePayment}
                        disabled={isProcessing}
                        className={`px-7 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg flex items-center gap-2.5 transition-all ${
                          isProcessing
                            ? 'bg-slate-400 cursor-wait'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{processingStage || 'Processing...'}</span>
                          </>
                        ) : (
                          <>
                            <FiLock className="w-4 h-4" />
                            <span>Authorize & Place Order (${totalAmount.toFixed(2)})</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================= */}
              {/* STEP 4: ORDER CONFIRMATION & RECEIPT */}
              {/* ========================================================= */}
              {currentStep === 4 && completedOrder && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 text-center space-y-6 relative overflow-hidden"
                >
                  {/* Confetti Explosion Celebration */}
                  <ConfettiBurst />

                  {/* Animated Success Checkmark Drawing In */}
                  <div className="relative mx-auto w-20 h-20">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 180 }}
                      className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/20"
                    >
                      <svg
                        className="w-10 h-10 stroke-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  </div>

                  <div>
                    <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                      Simulated Payment Authorized
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-space text-slate-900">
                      Wholesale Order Confirmed!
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
                      Your simulated B2B order has been committed to the TradeNest demo escrow ledger.
                    </p>
                  </div>

                  {/* Order Details Card */}
                  <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Order ID:</span>
                      <span className="font-bold text-slate-800 font-sans">
                        #ORD-TN-{completedOrder.orderId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Transaction Ref:</span>
                      <span className="font-bold text-emerald-700">{completedOrder.txnRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Simulated Paid Amount:</span>
                      <span className="font-bold text-slate-900 font-sans">
                        ${completedOrder.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Freight Dispatch:</span>
                      <span className="text-slate-700 font-sans">{completedOrder.shippingMethod}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowReceiptModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition"
                    >
                      <FiFileText className="w-4 h-4" />
                      <span>View & Print Commercial Invoice</span>
                    </motion.button>

                    <Link
                      to={isAuthenticated ? '/dashboard' : '/products'}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      {isAuthenticated ? 'Go to Buyer Dashboard' : 'Continue Sourcing'}
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: STICKY ORDER SUMMARY SIDEBAR */}
          <div className="sticky top-24 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
            <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            {/* Item Previews (Only if in step 2 or 3) */}
            {currentStep > 1 && currentStep < 4 && items.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-xs text-slate-600">
                    <span className="truncate max-w-[170px]">
                      {it.quantity}x {it.product?.name || it.product?.title}
                    </span>
                    <span className="font-mono font-medium">
                      ${((it.price_snapshot || it.product?.price || 0) * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations */}
            <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span>Wholesale Subtotal</span>
                <span className="font-mono font-bold text-slate-800">
                  ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Freight Shipping</span>
                <span className="font-mono text-slate-800">
                  ${selectedShipping.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Export Tax (Wholesale 0%)</span>
                <span className="font-mono text-emerald-600 font-medium">$0.00</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-2.5">
                <span>Total Amount</span>
                <span className="font-mono text-emerald-600 font-extrabold text-base">
                  ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Assurance Trust Badges */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <FiLock className="text-emerald-600 w-3.5 h-3.5 flex-shrink-0" />
                <span>256-Bit Bank-Grade Simulated SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <FiShield className="text-indigo-600 w-3.5 h-3.5 flex-shrink-0" />
                <span>Trade Assurance Escrow Coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <FiTruck className="text-cyan-600 w-3.5 h-3.5 flex-shrink-0" />
                <span>Verified Direct Factory Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
