import React from 'react'
import { motion } from 'framer-motion'
import { FiWifi } from 'react-icons/fi'

export default function AnimatedCreditCard({
  cardNumber = '',
  cardHolder = '',
  expiry = '',
  cvc = '',
  isFlipped = false,
  brand = 'generic',
}) {
  // Format 16 digits into 4 groups of 4
  const formattedNumber = cardNumber
    ? cardNumber
        .replace(/\D/g, '')
        .padEnd(16, '•')
        .match(/.{1,4}/g)
        ?.join(' ') || '•••• •••• •••• ••••'
    : '•••• •••• •••• ••••'

  // Brand badges
  const renderBrand = () => {
    switch (brand) {
      case 'visa':
        return (
          <span className="font-extrabold italic text-xl tracking-tighter text-white drop-shadow">
            VISA
          </span>
        )
      case 'mastercard':
        return (
          <div className="flex items-center -space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-red-500/90 shadow-sm" />
            <div className="w-6 h-6 rounded-full bg-amber-400/90 shadow-sm" />
          </div>
        )
      case 'amex':
        return (
          <span className="font-black text-xs uppercase px-2 py-1 bg-cyan-400/20 text-cyan-200 rounded border border-cyan-400/40">
            AMEX
          </span>
        )
      default:
        return (
          <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
            TradeNest B2B
          </span>
        )
    }
  }

  return (
    <div className="w-full max-w-[380px] h-[220px] mx-auto [perspective:1000px] select-none">
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 120 }}
        className="relative w-full h-full rounded-2xl shadow-2xl [transform-style:preserve-3d] cursor-pointer"
        style={{ willChange: 'transform' }}
      >
        {/* FRONT OF CARD */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl p-6 text-white bg-gradient-to-tr from-slate-900 via-indigo-950 to-emerald-950 border border-white/20 shadow-xl overflow-hidden [backface-visibility:hidden] flex flex-col justify-between"
        >
          {/* Subtle metallic shine overlay */}
          <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 transform" />

          {/* Top Row: Chip + Wifi + Brand */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {/* EMV Chip */}
              <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-1 shadow-inner relative overflow-hidden border border-amber-300/40">
                <div className="w-full h-full border border-amber-700/30 rounded-xs flex flex-col justify-between p-0.5 opacity-60">
                  <div className="border-b border-amber-800/40 w-full" />
                  <div className="border-b border-amber-800/40 w-full" />
                </div>
              </div>
              <FiWifi className="rotate-90 text-white/70 w-5 h-5" />
            </div>
            {renderBrand()}
          </div>

          {/* Card Number */}
          <div className="z-10 my-auto">
            <div className="font-mono text-xl sm:text-2xl font-bold tracking-[0.16em] text-white/95 drop-shadow">
              {formattedNumber}
            </div>
          </div>

          {/* Bottom Row: Holder Name + Expiry */}
          <div className="flex items-end justify-between z-10 text-xs">
            <div className="max-w-[70%]">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                Cardholder
              </span>
              <span className="font-mono font-bold text-sm tracking-wider uppercase text-white truncate block">
                {cardHolder || 'CORPORATE BUYER'}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                Expires
              </span>
              <span className="font-mono font-bold text-sm tracking-wider text-white">
                {expiry || 'MM/YY'}
              </span>
            </div>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div
          className="absolute inset-0 w-full h-full rounded-2xl p-6 text-white bg-gradient-to-bl from-slate-950 via-slate-900 to-indigo-950 border border-white/20 shadow-xl overflow-hidden [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-between"
        >
          {/* Magnetic Stripe */}
          <div className="absolute top-7 left-0 right-0 h-11 bg-slate-950 shadow-inner" />

          <div className="mt-14 z-10">
            {/* Signature & CVC strip */}
            <div className="flex items-center justify-between bg-white/90 rounded p-1.5 px-3">
              <span className="font-caveat text-slate-600 text-xs italic tracking-wider select-none">
                Authorized Signature
              </span>
              <div className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-slate-900 font-mono font-bold text-sm tracking-widest">
                {cvc || '•••'}
              </div>
            </div>
            <span className="block text-[9px] text-right text-slate-400 mt-1 uppercase tracking-wider">
              Security Code (CVC)
            </span>
          </div>

          {/* Back Info */}
          <div className="z-10 text-[9px] text-slate-400 leading-tight">
            <p>TradeNest Escrow & Wholesale B2B Clearing Network.</p>
            <p className="mt-0.5 text-slate-500">
              For demo/academic verification purposes only. Simulated card sandbox.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
