import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import { motion, useReducedMotion } from 'framer-motion'
import {
  FiArrowUpRight,
  FiCheck,
  FiGlobe,
  FiPackage,
  FiShield,
  FiTrendingUp,
  FiLock,
  FiZap,
} from 'react-icons/fi'

import MeshBackground from '../components/animations/MeshBackground'
import RevealText from '../components/animations/RevealText'
import ParallaxTilt from '../components/animations/ParallaxTilt'
import GradientBorderButton from '../components/animations/GradientBorderButton'
import FloatingBadge from '../components/animations/FloatingBadge'
import AnimatedCounter from '../components/animations/AnimatedCounter'
import DrawingPath from '../components/animations/DrawingPath'
import TestimonialCarousel from '../components/animations/TestimonialCarousel'

const featureTiles = [
  {
    title: 'Verified suppliers',
    subtitle: 'Directly audited manufacturing partners with verified production capacity.',
    icon: FiShield,
  },
  {
    title: 'Dynamic volume tiers',
    subtitle: 'Automated quantity discounts tailored for enterprise and SME buying power.',
    icon: FiTrendingUp,
  },
  {
    title: 'Global escrow security',
    subtitle: 'Funds released only upon buyer quality inspection and verified delivery.',
    icon: FiGlobe,
  },
]

const categories = [
  { name: 'Electronics', meta: '2,480 listings', icon: '⚡', color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Home & kitchen', meta: '1,920 listings', icon: '🏺', color: 'bg-cyan-50 text-cyan-600' },
  { name: 'Industrial', meta: '860 listings', icon: '🔧', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Packaging', meta: '640 listings', icon: '📦', color: 'bg-amber-50 text-amber-600' },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    api
      .get('/api/products')
      .then((r) => setProducts(r.data))
      .catch(() => {})
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  }

  return (
    <div className="overflow-hidden">
      {/* ========================================================= */}
      {/* HERO SECTION WITH LIVING MESH, BLUR REVEAL, 3D PARALLAX */}
      {/* ========================================================= */}
      <MeshBackground className="border-b border-slate-200/70 pb-20 pt-16 lg:pb-32 lg:pt-24">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          {/* Left Hero Column */}
          <div>
            {/* Living Floating Pill Badge */}
            <FloatingBadge offset={4} duration={3.5} dotColor="bg-emerald-400">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-800">
                The Next Generation of Wholesale
              </span>
            </FloatingBadge>

            {/* Word-by-Word Blurred Reveal Headline */}
            <div className="mt-6">
              <RevealText
                text="Source better. Build faster."
                as="h1"
                className="font-space text-5xl font-bold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-7xl"
              />
            </div>

            {/* Hero Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35, ease: 'easeOut' }}
              className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg"
            >
              TradeNest bridges global verified manufacturers with agile retailers. 
              Enjoy transparent wholesale tiers, protected escrow transactions, and instant MOQ fulfillment.
            </motion.p>

            {/* Call To Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <GradientBorderButton as="a" href="/products">
                Explore marketplace <FiArrowUpRight className="text-cyan-300" size={17} />
              </GradientBorderButton>

              <motion.a
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/80 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition hover:border-indigo-300 hover:bg-white"
              >
                See how it works
              </motion.a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.65 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500"
            >
              <span className="inline-flex items-center gap-2">
                <FiCheck className="text-emerald-500" /> Zero listing fees
              </span>
              <span className="inline-flex items-center gap-2">
                <FiLock className="text-indigo-500" /> Bank-grade escrow
              </span>
              <span className="inline-flex items-center gap-2">
                <FiZap className="text-amber-500" /> Instant MOQ quotes
              </span>
            </motion.div>
          </div>

          {/* Right Hero Graphic: Live 3D Parallax Tilt with Interactive Telemetry */}
          <div className="relative mx-auto w-full max-w-lg">
            {/* Ambient colorful glow backdrop */}
            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-indigo-500/25 via-cyan-400/20 to-purple-600/25 blur-2xl" />

            <ParallaxTilt maxTilt={10} floatAmplitude={6} floatDuration={6}>
              <div className="relative overflow-hidden rounded-[2.2rem] border border-white/80 bg-slate-950/95 p-3.5 shadow-2xl shadow-indigo-950/40 backdrop-blur-2xl">
                <div className="rounded-[1.6rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white border border-white/10">
                  {/* Card Header with Floating Chip */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                        <FiTrendingUp size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Supplier Engine
                        </p>
                        <p className="text-[11px] text-slate-500">Live platform telemetry</p>
                      </div>
                    </div>
                    <FloatingBadge
                      offset={3}
                      duration={3}
                      delay={0.5}
                      dotColor="bg-emerald-400"
                      className="bg-slate-800/80 text-emerald-300 border-emerald-500/30 text-[10px]"
                    >
                      Real-time
                    </FloatingBadge>
                  </div>

                  {/* Main Metric */}
                  <div className="mt-8 grid grid-cols-[1fr_auto] items-end gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Avg. order value</p>
                      <p className="mt-1 font-space text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        $2,840
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        +18.4% this month
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/20">
                      <FiTrendingUp size={24} />
                    </div>
                  </div>

                  {/* Animated Wave Bar Graph */}
                  <div className="mt-8 flex h-28 items-end gap-2.5">
                    {[35, 52, 44, 68, 62, 85, 74, 98, 88, 100].map((height, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{
                          duration: 1,
                          delay: 0.1 * index,
                          ease: 'easeOut',
                        }}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 via-indigo-400 to-cyan-300 opacity-80 hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </div>

                  {/* Telemetry Micro Grid */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
                      <p className="text-xs text-slate-400">New suppliers</p>
                      <p className="mt-1 font-space text-lg font-bold text-white">248</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm">
                      <p className="text-xs text-slate-400">On-time fulfillment</p>
                      <p className="mt-1 font-space text-lg font-bold text-emerald-300">96.8%</p>
                    </div>
                  </div>
                </div>
              </div>
            </ParallaxTilt>

            {/* Orbiting Satellite Floating Badges */}
            <div className="absolute -bottom-5 -left-6 z-20">
              <FloatingBadge
                offset={6}
                duration={4.2}
                delay={1}
                dotColor="bg-cyan-400"
                className="bg-white/90 text-slate-800 shadow-xl"
              >
                100% Escrow Protected
              </FloatingBadge>
            </div>

            <div className="absolute -top-4 -right-4 z-20">
              <FloatingBadge
                offset={7}
                duration={4.8}
                delay={2}
                dotColor="bg-indigo-500"
                className="bg-white/90 text-slate-800 shadow-xl"
              >
                Tier-1 Manufacturers
              </FloatingBadge>
            </div>
          </div>
        </div>
      </MeshBackground>

      {/* ========================================================= */}
      {/* SCROLL TRIGGERED STATS COUNTER WITH EASED TIMING */}
      {/* ========================================================= */}
      <section className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200/80 px-4 py-8 sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { value: '15000', prefix: '', suffix: '+', label: 'Verified suppliers' },
            { value: '48000', prefix: '', suffix: '+', label: 'Wholesale products' },
            { value: '92', prefix: '', suffix: '', label: 'Countries served' },
            { value: '99', prefix: '', suffix: '%', label: 'Buyer satisfaction' },
          ].map((stat) => (
            <div key={stat.label} className="px-4 first:pl-0 sm:px-8">
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="text-3xl sm:text-4xl text-ink"
              />
              <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* BROWSE BY INDUSTRY: POP-IN + HOVER WIGGLE ICONS */}
      {/* ========================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600">
              Browse by industry
            </p>
            <h2 className="mt-2 font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              A world of supply, organized.
            </h2>
          </div>
          <a
            href="/products"
            className="hidden text-sm font-bold text-indigo-600 hover:text-indigo-700 transition sm:inline-flex items-center gap-1"
          >
            View all categories <FiArrowUpRight />
          </a>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {categories.map((category) => (
            <motion.a
              key={category.name}
              href="/products"
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50"
            >
              {/* Continuous Icon bounce/wiggle on card hover */}
              <motion.span
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        rotate: [0, -10, 10, -5, 5, 0],
                        scale: [1, 1.15, 1.1],
                        transition: { duration: 0.6, repeat: Infinity, repeatType: 'reverse' },
                      }
                }
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm ${category.color}`}
              >
                {category.icon}
              </motion.span>
              <h3 className="mt-5 font-space text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {category.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-medium">{category.meta}</p>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* ========================================================= */}
      {/* FEATURED PRODUCTS: STAGGERED REVEAL & MICRO-ANIMATIONS */}
      {/* ========================================================= */}
      <section className="bg-slate-50/70 border-y border-slate-200/70 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
                Curated wholesale
              </p>
              <h2 className="mt-2 font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Products buyers love
              </h2>
            </div>
            <a
              href="/products"
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition inline-flex items-center gap-1"
            >
              View all products <FiArrowUpRight />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* HOW IT WORKS: SELF-DRAWING CONNECTING SVG LINE */}
      {/* ========================================================= */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
            Frictionless Procurement
          </p>
          <h2 className="mt-3 font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            From search to shipment, without the busywork.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            A focused 3-step workflow designed for procurement teams who care about product authenticity and fast turnarounds.
          </p>
        </div>

        {/* Self-drawing SVG path connecting steps */}
        <div className="hidden lg:block mb-4">
          <DrawingPath />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {featureTiles.map((tile, index) => {
            const Icon = tile.icon
            return (
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                key={tile.title}
                className="group relative rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110">
                    <Icon size={22} />
                  </span>
                  <span className="font-space text-2xl font-bold text-slate-300 group-hover:text-indigo-600 transition-colors">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-space text-xl font-bold text-slate-900">{tile.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                  {tile.subtitle}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* TESTIMONIAL CAROUSEL WITH CONTINUOUS PROGRESS BAR */}
      {/* ========================================================= */}
      <section className="bg-gradient-to-b from-white to-slate-50 px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-200/70">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
            Trusted Worldwide
          </p>
          <h2 className="mt-2 font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Powering modern trade
          </h2>
        </div>
        <TestimonialCarousel />
      </section>

      {/* ========================================================= */}
      {/* CTA BANNER */}
      {/* ========================================================= */}
      <section
        id="contact"
        className="mx-4 mb-20 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950 px-6 py-16 text-white shadow-2xl shadow-indigo-500/20 sm:mx-6 sm:px-14 lg:mx-auto lg:max-w-7xl relative"
      >
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Ready to scale?
            </p>
            <h3 className="mt-3 max-w-xl font-space text-3xl font-bold tracking-tight sm:text-4xl">
              The right wholesale supplier is closer than you think.
            </h3>
            <p className="mt-3 max-w-lg text-indigo-100/90 text-sm sm:text-base">
              Join thousands of retail businesses and verified manufacturers already executing orders seamlessly on TradeNest.
            </p>
          </div>
          <motion.a
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            href="/register"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-indigo-700 shadow-xl transition hover:bg-cyan-50"
          >
            Create your account <FiArrowUpRight size={18} />
          </motion.a>
        </div>
      </section>
    </div>
  )
}
