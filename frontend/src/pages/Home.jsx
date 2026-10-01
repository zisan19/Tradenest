import React, { useEffect, useState } from "react";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiArrowUpRight,
  FiCheck,
  FiGlobe,
  FiPackage,
  FiShield,
  FiTrendingUp,
  FiLock,
  FiZap,
} from "react-icons/fi";

import MeshBackground from "../components/animations/MeshBackground";
import RevealText from "../components/animations/RevealText";
import ParallaxTilt from "../components/animations/ParallaxTilt";
import GradientBorderButton from "../components/animations/GradientBorderButton";
import FloatingBadge from "../components/animations/FloatingBadge";
import AnimatedCounter from "../components/animations/AnimatedCounter";
import DrawingPath from "../components/animations/DrawingPath";
import TestimonialCarousel from "../components/animations/TestimonialCarousel";

const featureTiles = [
  {
    title: "Verified suppliers",
    subtitle:
      "Directly audited manufacturing partners with verified production capacity.",
    icon: FiShield,
  },
  {
    title: "Dynamic volume tiers",
    subtitle:
      "Automated quantity discounts tailored for enterprise and SME buying power.",
    icon: FiTrendingUp,
  },
  {
    title: "Global escrow security",
    subtitle:
      "Funds released only upon buyer quality inspection and verified delivery.",
    icon: FiGlobe,
  },
];

const categories = [
  {
    name: "Electronics",
    meta: "2,480 listings",
    icon: "⚡",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    name: "Home & kitchen",
    meta: "1,920 listings",
    icon: "🏺",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    name: "Industrial",
    meta: "860 listings",
    icon: "🔧",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    name: "Packaging",
    meta: "640 listings",
    icon: "📦",
    color: "bg-amber-50 text-amber-600",
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    api
      .get("/api/products")
      .then((r) => setProducts(r.data))
      .catch(() => {});
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

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
              transition={{ duration: 0.65, delay: 0.35, ease: "easeOut" }}
              className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg"
            >
              TradeNest bridges global verified manufacturers with agile
              retailers. Enjoy transparent wholesale tiers, protected escrow
              transactions, and instant MOQ fulfillment.
            </motion.p>

            {/* Call To Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <GradientBorderButton as="a" href="/products">
                Explore marketplace{" "}
                <FiArrowUpRight className="text-cyan-300" size={17} />
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
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
                {/* Dark analytics canvas */}
                <div className="relative overflow-hidden bg-slate-950 px-5 pb-5 pt-6 sm:px-7 sm:pt-7">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl"
                  />
                  <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                        Supplier Engine
                      </p>
                      <h2 className="mt-2 font-space text-xl font-semibold tracking-tight text-white">
                        Live platform telemetry
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Real-time
                    </span>
                  </div>

                  <div className="relative mt-7 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Avg. order value</p>
                      <p className="mt-2 font-space text-5xl font-bold tracking-tighter text-white sm:text-6xl">
                        <span className="mr-1 text-3xl font-normal text-slate-500">
                          $
                        </span>
                        2,840
                      </p>
                    </div>
                    <div className="mb-1 border-l border-white/15 pl-4">
                      <p className="flex items-center gap-1 text-sm font-bold text-emerald-300">
                        <FiArrowUpRight size={17} aria-hidden="true" /> +18.4%
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        this month
                      </p>
                    </div>
                  </div>

                  {/* Area trend replaces the bar chart; same ten relative observations */}
                  <div className="relative mt-5">
                    <svg
                      viewBox="0 0 360 145"
                      className="block h-auto w-full overflow-visible"
                      role="img"
                      aria-label="Illustrative order value trend: relative values 35, 52, 44, 68, 62, 85, 74, 98, 88, 100."
                    >
                      {[30, 75, 120].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="360"
                          y2={y}
                          stroke="white"
                          strokeOpacity="0.08"
                          strokeDasharray="3 6"
                        />
                      ))}
                      <path
                        d="M 8 92 L 46 73.6 L 84 82.2 L 122 56.3 L 160 62.8 L 198 38 L 236 49.8 L 274 23.9 L 312 34.7 L 350 21 L 350 135 L 8 135 Z"
                        fill="#22d3ee"
                        fillOpacity="0.09"
                      />
                      <motion.path
                        d="M 8 92 L 46 73.6 L 84 82.2 L 122 56.3 L 160 62.8 L 198 38 L 236 49.8 L 274 23.9 L 312 34.7 L 350 21"
                        fill="none"
                        stroke="#67e8f9"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={shouldReduceMotion ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 1.2,
                          ease: "easeOut",
                        }}
                      />
                      <line
                        x1="350"
                        y1="21"
                        x2="350"
                        y2="135"
                        stroke="#67e8f9"
                        strokeOpacity="0.35"
                        strokeDasharray="3 5"
                      />
                      <circle
                        cx="350"
                        cy="21"
                        r="10"
                        fill="#22d3ee"
                        fillOpacity="0.15"
                      />
                      <circle
                        cx="350"
                        cy="21"
                        r="4"
                        fill="#a5f3fc"
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="flex justify-between text-[10px] font-medium text-slate-500">
                      <span>Earlier</span>
                      <span className="text-cyan-300">Latest observation</span>
                    </div>
                  </div>
                </div>

                {/* Compact operations summary with a circular fulfillment gauge */}
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-6 sm:px-7">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Supply network
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <FiPackage
                        className="shrink-0 text-indigo-500"
                        size={21}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-space text-3xl font-bold leading-none tracking-tight text-slate-900">
                          248
                        </p>
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          New suppliers
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="relative mx-auto h-24 w-24">
                      <svg
                        viewBox="0 0 100 100"
                        className="h-full w-full -rotate-90"
                        aria-hidden="true"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="6"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="6"
                          strokeLinecap="round"
                          pathLength="100"
                          strokeDasharray="100 100"
                          initial={
                            shouldReduceMotion
                              ? false
                              : { strokeDashoffset: 100 }
                          }
                          animate={{ strokeDashoffset: 3.2 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 1.2,
                            ease: "easeOut",
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-space text-lg font-bold tracking-tight text-slate-900">
                        96.8%
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                      On-time fulfillment
                    </p>
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
            {
              value: "15000",
              prefix: "",
              suffix: "+",
              label: "Verified suppliers",
            },
            {
              value: "48000",
              prefix: "",
              suffix: "+",
              label: "Wholesale products",
            },
            { value: "92", prefix: "", suffix: "", label: "Countries served" },
            {
              value: "99",
              prefix: "",
              suffix: "%",
              label: "Buyer satisfaction",
            },
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
          viewport={{ once: true, margin: "-40px" }}
          className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {categories.map((category) => (
            <motion.a
              key={category.name}
              href="/products"
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
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
                        transition: {
                          duration: 0.6,
                          repeat: Infinity,
                          repeatType: "reverse",
                        },
                      }
                }
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm ${category.color}`}
              >
                {category.icon}
              </motion.span>
              <h3 className="mt-5 font-space text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {category.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {category.meta}
              </p>
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
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
            Frictionless Procurement
          </p>
          <h2 className="mt-3 font-space text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            From search to shipment, without the busywork.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            A focused 3-step workflow designed for procurement teams who care
            about product authenticity and fast turnarounds.
          </p>
        </div>

        {/* Self-drawing SVG path connecting steps */}
        <div className="hidden lg:block mb-4">
          <DrawingPath />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {featureTiles.map((tile, index) => {
            const Icon = tile.icon;
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
                <h3 className="mt-6 font-space text-xl font-bold text-slate-900">
                  {tile.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 font-medium">
                  {tile.subtitle}
                </p>
              </motion.div>
            );
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
              Join thousands of retail businesses and verified manufacturers
              already executing orders seamlessly on TradeNest.
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
  );
}
