import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'
import AnimatedInput from '../components/animations/AnimatedInput'
import AnimatedSubmitButton from '../components/animations/AnimatedSubmitButton'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shake, setShake] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [toast, setToast] = useState(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()

  const triggerShake = () => {
    if (shouldReduceMotion) return
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setErrorMessage('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      triggerShake()
      setErrorMessage('Please fill in both email and password.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const authResult = await login(email, password)
      setSuccess(true)
      // Display drawn checkmark briefly before smooth navigation
      setTimeout(() => {
        const destination = authResult?.roleHome || '/dashboard'
        navigate(destination, { replace: true })
      }, 750)
    } catch (err) {
      console.error('[Login Failure]', err)
      triggerShake()
      let msg = 'Login failed. Please verify your credentials.'
      if (err.response?.status === 401) {
        msg = 'Incorrect email or password. Check your demo account credentials.'
      } else if (err.response?.status === 429) {
        msg = 'Too many requests. Please pause a moment before retrying.'
      } else if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : 'Invalid login request details.'
      } else if (err.message && err.message.includes('Network Error')) {
        msg = 'Network Error: Cannot connect to FastAPI at http://localhost:8000.'
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
        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
          Sign In
        </span>
        <h2 className="mt-3 font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Access your TradeNest workspace, verified products, and order analytics.
        </p>
      </motion.div>

      {/* Form Card with Shake on Error */}
      <motion.div
        animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="mt-8 rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-indigo-950/5 backdrop-blur-xl"
      >
        {/* Error Alert Box */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs font-medium text-red-700"
          >
            <p className="font-bold text-red-800">Authentication error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </motion.div>
        )}

        <form onSubmit={submit} className="space-y-4">
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
            label="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setErrorMessage('')
            }}
            required
            error={!!errorMessage}
          />

          <div className="pt-2">
            <AnimatedSubmitButton loading={loading} success={success}>
              Sign in to TradeNest
            </AnimatedSubmitButton>
          </div>
        </form>

        {/* Demo Accounts Quick-Fill Section */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
            Demo Accounts for Evaluation
          </p>
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => fillCredentials('admin@tradenest.com', 'adminpass')}
              className="rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              Admin
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => fillCredentials('supplier@tradenest.com', 'supplierpass')}
              className="rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              Supplier
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => fillCredentials('buyer@tradenest.com', 'buyerpass')}
              className="rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 px-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              Buyer
            </motion.button>
          </div>
        </div>

        {/* Alternate link */}
        <p className="mt-6 text-center text-xs text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:underline">
            Register here
          </Link>
        </p>
      </motion.div>

      <Toast message={toast?.message} type={toast?.type} />
    </div>
  )
}
