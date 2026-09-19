import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import api from '../api/axios'
import Toast from '../components/Toast'
import AnimatedInput from '../components/animations/AnimatedInput'
import AnimatedSubmitButton from '../components/animations/AnimatedSubmitButton'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('buyer')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()

  const triggerShake = () => {
    if (shouldReduceMotion) return
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !password || !name) {
      triggerShake()
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (password.length < 8) {
      triggerShake()
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const cleanEmail = email.trim().toLowerCase()
      await api.post('/api/auth/register', {
        email: cleanEmail,
        password,
        full_name: name,
        role,
      })
      setSuccess(true)
      setToast({ message: 'Account created! Redirecting to login...', type: 'success' })
      setTimeout(() => navigate('/login', { replace: true }), 1000)
    } catch (err) {
      console.error('[Registration Error]', err)
      triggerShake()
      let msg = 'Registration failed. Please try again.'
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : 'Invalid registration information.'
      }
      setErrorMessage(msg)
      setToast({ message: msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <span className="inline-block rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700">
          Get Started
        </span>
        <h2 className="mt-3 font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Create an account
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Join TradeNest to procure products or supply global retailers.
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-indigo-950/5 backdrop-blur-xl"
      >
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-medium text-red-700"
          >
            <p className="font-bold text-red-800">Registration error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </motion.div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <AnimatedInput
            id="name"
            type="text"
            label="Full name or company"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrorMessage('')
            }}
            required
            error={!!errorMessage}
          />

          <AnimatedInput
            id="email"
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrorMessage('')
            }}
            required
            error={!!errorMessage}
          />

          <AnimatedInput
            id="password"
            type="password"
            label="Password (min. 8 characters)"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrorMessage('')
            }}
            required
            error={!!errorMessage}
          />

          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/60"
            >
              <option value="buyer">Retailer / Buyer (Procure Wholesale)</option>
              <option value="supplier">Supplier / Manufacturer (Sell Products)</option>
            </select>
          </div>

          <div className="pt-2">
            <AnimatedSubmitButton loading={loading} success={success}>
              Create TradeNest Account
            </AnimatedSubmitButton>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500 font-medium">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-indigo-600 hover:underline">
            Sign in here
          </Link>
        </p>
      </motion.div>

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  )
}
