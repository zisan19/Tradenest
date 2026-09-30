import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import ProductCard from '../components/ProductCard'
import SkeletonLoader from '../components/SkeletonLoader'
import { FiSearch, FiSliders } from 'react-icons/fi'
import AnimatedSection from '../components/AnimatedSection'
import GradientButton from '../components/GradientButton'

export default function ProductList(){
  const [products, setProducts] = useState(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState(false)

  useEffect(()=>{
    api.get('/api/products').then(r=>setProducts(r.data)).catch(()=>{ setProducts([]); setError(true) })
  },[])

  const search = ()=>{
    api.get('/api/products', { params: { q } }).then(r=>{ setProducts(r.data); setError(false) }).catch(()=>{ setProducts([]); setError(true) })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-9 flex flex-col gap-6 border-b border-slate-200/80 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-600">The marketplace</p>
          <h1 className="mt-2 font-space text-4xl font-bold tracking-tight text-ink">Wholesale products</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Browse trusted supply, compare MOQs, and connect with suppliers ready to grow with your business.</p>
        </div>
        <div className="flex w-full gap-2 md:max-w-md">
          <label className="relative flex-1"><span className="sr-only">Search products</span><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key === 'Enter' && search()} placeholder="Search products" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary/50 focus:ring-4 focus:ring-primary/10" /></label>
          <GradientButton onClick={search} className="px-4 py-3"><FiSearch /> <span className="hidden sm:inline">Search</span></GradientButton>
        </div>
      </div>
      <div className="mb-5 flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{products ? `${products.length} products available` : 'Finding the right supply...'}</p><button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-primary/30 hover:text-primary"><FiSliders /> Filters</button></div>
      {!products ? <SkeletonLoader count={6} /> : error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center"><h2 className="font-space text-xl font-bold text-rose-900">Products are taking a moment</h2><p className="mt-2 text-sm text-rose-700">We could not connect to the marketplace. Please try your search again.</p><button onClick={search} className="mt-5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white">Retry</button></div> : products.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="font-space text-xl font-bold text-slate-800">No products found</h2><p className="mt-2 text-sm text-slate-500">Try a broader search or browse the full marketplace.</p></div> : (
        <AnimatedSection className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map(p=> <ProductCard key={p.id} product={p} />)}
        </AnimatedSection>
      )}
    </div>
  )
}
