import React from 'react'

export default function Footer(){
  return (
    <footer className="mt-12 border-t border-indigo-200/70 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div><div className="font-space text-2xl font-bold text-white">TradeNest<span className="text-cyan-400">.</span></div><p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">Wholesale sourcing infrastructure for the businesses shaping what comes next.</p></div>
        <div><h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Explore</h2><div className="mt-4 grid gap-3 text-sm"><a href="/products" className="transition hover:text-white">Marketplace</a><a href="/register" className="transition hover:text-white">Become a supplier</a><a href="/dashboard" className="transition hover:text-white">Dashboard</a></div></div>
        <div><h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Get in touch</h2><p className="mt-4 text-sm text-slate-400">hello@tradenest.com</p><p className="mt-2 text-sm text-slate-400">Built for modern procurement teams.</p></div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>© {new Date().getFullYear()} TradeNest. All rights reserved.</span><span>Trusted wholesale, made simple.</span></div></div>
    </footer>
  )
}
