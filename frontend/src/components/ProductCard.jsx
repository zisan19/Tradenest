import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiArrowUpRight, FiCheckCircle, FiPackage, FiHeart, FiShoppingBag } from 'react-icons/fi'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [liked, setLiked] = useState(false)
  const [particles, setParticles] = useState([])
  const shouldReduceMotion = useReducedMotion()

  const handleHeartClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const nextLiked = !liked
    setLiked(nextLiked)

    if (nextLiked && !shouldReduceMotion) {
      // Spawn 6 tiny particles bursting outwards in radial angles
      const newParticles = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60 * Math.PI) / 180
        const distance = 22 + Math.random() * 8
        return {
          id: Math.random(),
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
        }
      })
      setParticles(newParticles)
      setTimeout(() => setParticles([]), 700)
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/70"
    >
      <Link
        to={`/products/${product.id}`}
        className="flex flex-1 flex-col rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30"
      >
        {/* Image Container with Zoom & Gradient Reveal */}
        <div className="relative h-52 w-full overflow-hidden rounded-xl bg-slate-100 shadow-inner sm:h-48">
          <motion.img
            src={product.image_url || '/placeholder.png'}
            alt={product.name}
            className="h-full w-full object-cover will-change-transform"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />

          {/* Hover Gradient Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Live Continuous Pulsing "Verified" Badge */}
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <motion.span
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        scale: [1, 2, 1],
                        opacity: [0.8, 0, 0.8],
                      }
                }
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Verified
          </div>

          {/* Wishlist Heart with Pop + Particle Burst */}
          <div className="absolute right-3 top-3 z-10">
            <motion.button
              type="button"
              onClick={handleHeartClick}
              whileTap={{ scale: 0.8 }}
              aria-label="Save to wishlist"
              className={`relative flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
                liked
                  ? 'bg-rose-50 text-rose-500 shadow-md shadow-rose-200'
                  : 'bg-white/85 text-slate-500 hover:bg-white hover:text-rose-500'
              }`}
            >
              <motion.div
                animate={
                  liked
                    ? { scale: [1, 1.4, 0.9, 1.15, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <FiHeart
                  size={15}
                  className={`transition-colors ${liked ? 'fill-rose-500 text-rose-500' : ''}`}
                />
              </motion.div>

              {/* Particle sparks on like */}
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    initial={{ scale: 0.8, opacity: 1, x: 0, y: 0 }}
                    animate={{
                      scale: 0,
                      opacity: 0,
                      x: p.x,
                      y: p.y,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-rose-500"
                  />
                ))}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Quick Price Tag that slides up on hover */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 translate-y-2">
            <span className="font-semibold text-cyan-300">Direct Factory</span>
            <span className="font-bold">${Number(product.price).toFixed(2)}/unit</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col px-1 pt-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-space text-lg font-bold leading-6 text-slate-900 group-hover:text-indigo-600 transition-colors">
              {product.name}
            </h3>
            <FiArrowUpRight className="mt-1 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-600" />
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {product.description || 'Reliable wholesale supply for growing businesses.'}
          </p>

          <div className="mt-auto flex items-end justify-between gap-2 pt-5">
            <div>
              <div className="font-space text-xl font-bold text-indigo-600">
                ${Number(product.price).toFixed(2)}{' '}
                <span className="font-inter text-xs font-medium text-slate-400">/ unit</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <FiPackage size={13} /> MOQ {product.moq}{' '}
                <span className="text-slate-300">|</span> {product.stock} in stock
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Action Buttons: View Details & Quick Add to Cart */}
      <div className="mt-3 flex items-center gap-2">
        <Link
          to={`/products/${product.id}`}
          className="flex-1 flex items-center justify-center rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          View details
        </Link>
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const rect = e.currentTarget.getBoundingClientRect()
            addItem(product, product.moq || 1, rect)
          }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          title={`Add wholesale MOQ (${product.moq || 1} units) to cart`}
        >
          <FiShoppingBag size={14} />
          <span>Add</span>
        </motion.button>
      </div>
    </motion.article>
  )
}
