import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi'

const testimonials = [
  {
    quote: 'TradeNest transformed our procurement operations. We reduced supplier onboarding time from 3 weeks to 48 hours with guaranteed MOQ protection.',
    author: 'Elena Rostova',
    role: 'VP of Supply Chain, Apex Global',
    metric: '4.2x faster sourcing',
    rating: 5,
  },
  {
    quote: 'The verified supplier network gave us total peace of mind. We have processed over $320,000 in orders this quarter without a single quality dispute.',
    author: 'Marcus Vance',
    role: 'Procurement Director, Lumina Retail',
    metric: '99.8% order accuracy',
    rating: 5,
  },
  {
    quote: 'The flexible wholesale financing and direct factory pricing allowed our boutique chain to expand inventory margins by 34% within 90 days.',
    author: 'Siddharth Nair',
    role: 'Founder & CEO, Horizon Commerce',
    metric: '+34% gross margin',
    rating: 5,
  },
]

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const intervalDuration = 6000 // 6 seconds per slide

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, intervalDuration)
    return () => clearInterval(timer)
  }, [isPaused])

  const nextSlide = () => setCurrent((prev) => (prev + 1) % testimonials.length)
  const prevSlide = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)

  const slideVariants = {
    enter: { opacity: 0, scale: 0.96, y: 15 },
    center: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      y: -15,
      transition: { duration: 0.35, ease: 'easeIn' },
    },
  }

  const activeTestimonial = testimonials[current]

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-indigo-950/5 backdrop-blur-xl sm:p-12"
    >
      {/* Background soft ambient tint */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-bl from-indigo-100/60 to-cyan-100/30 blur-3xl" />

      {/* Continuously animated progress bar at top edge */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
        <motion.div
          key={current}
          initial={{ width: '0%' }}
          animate={isPaused || shouldReduceMotion ? { width: '100%' } : { width: '100%' }}
          transition={{ duration: intervalDuration / 1000, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
        />
      </div>

      <div className="relative z-10">
        {/* Star rating & verified tag */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 text-amber-400">
            {[...Array(activeTestimonial.rating)].map((_, i) => (
              <FiStar key={i} className="fill-current text-amber-400" size={16} />
            ))}
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            {activeTestimonial.metric}
          </span>
        </div>

        {/* Dynamic Animated Content */}
        <div className="min-h-[140px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <p className="font-space text-xl font-medium leading-relaxed text-slate-800 sm:text-2xl">
                “{activeTestimonial.quote}”
              </p>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">{activeTestimonial.author}</h4>
                  <p className="text-xs text-slate-500">{activeTestimonial.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Footer & Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          {/* Slide dots */}
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="relative h-2 rounded-full transition-all focus:outline-none"
                style={{
                  width: i === current ? '2rem' : '0.5rem',
                  backgroundColor: i === current ? '#4F46E5' : '#cbd5e1',
                }}
              />
            ))}
          </div>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={prevSlide}
              aria-label="Previous testimonial"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              <FiChevronLeft size={18} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={nextSlide}
              aria-label="Next testimonial"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
            >
              <FiChevronRight size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
