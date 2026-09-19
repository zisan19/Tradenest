import React, { useState } from 'react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip)

const ranges = {
  '7D': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [420, 580, 510, 720, 680, 860, 940], revenue: [420, 580, 510, 720, 680, 860, 940] },
  '30D': { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], values: [2840, 3260, 3980, 4520], revenue: [2840, 3260, 3980, 4520] },
  '90D': { labels: ['Jan', 'Feb', 'Mar'], values: [8420, 10180, 12740], revenue: [8420, 10180, 12740] },
}

const axis = { border: { display: false }, grid: { color: '#eef2ff' }, ticks: { color: '#94a3b8', font: { size: 11 } } }
const baseOptions = { responsive: true, maintainAspectRatio: false, animation: { duration: 650, easing: 'easeOutQuart' }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0b1220', padding: 12, displayColors: false } } }

function ChartPanel({ title, subtitle, children, className = '' }){
  return <section className={`card min-w-0 ${className}`}><div className="mb-5"><h2 className="font-space text-lg font-bold text-ink">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div><div className="h-64 min-w-0">{children}</div></section>
}

export default function AnalyticsCharts(){
  const [range, setRange] = useState('7D')
  const selected = ranges[range]
  const salesData = { labels: selected.labels, datasets: [{ label: 'Revenue', data: selected.values, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.13)', fill: true, tension: .4, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: '#6366f1' }] }
  const revenueData = { labels: selected.labels, datasets: [{ label: 'Revenue', data: selected.revenue, backgroundColor: ['#a5b4fc', '#818cf8', '#6366f1', '#4f46e5'], borderRadius: 7, maxBarThickness: 34 }] }
  const productData = { labels: ['USB-C Cable', 'LED Panel Light', 'Steel Utensils', 'Storage Bins', 'Desk Organiser'], datasets: [{ label: 'Units sold', data: [820, 690, 540, 420, 320], backgroundColor: '#06b6d4', borderRadius: 6, barThickness: 16 }] }
  const orderData = { labels: ['Pending', 'Processing', 'Delivered', 'Cancelled'], datasets: [{ data: [18, 26, 48, 8], backgroundColor: ['#fbbf24', '#818cf8', '#10b981', '#fda4af'], borderWidth: 0, hoverOffset: 5 }] }
  const lineOptions = { ...baseOptions, scales: { x: { ...axis, grid: { display: false } }, y: { ...axis, beginAtZero: true } } }
  const barOptions = { ...baseOptions, scales: { x: { ...axis, grid: { display: false } }, y: { ...axis, beginAtZero: true } } }
  const horizontalOptions = { ...baseOptions, indexAxis: 'y', scales: { x: { ...axis, beginAtZero: true }, y: { ...axis, grid: { display: false } } } }
  const doughnutOptions = { ...baseOptions, cutout: '72%', plugins: { ...baseOptions.plugins, tooltip: { ...baseOptions.plugins.tooltip, displayColors: true } } }

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-space text-2xl font-bold tracking-tight text-ink">Analytics overview</h2><p className="mt-1 text-sm text-slate-500">Trends and performance snapshots for your marketplace.</p></div><div className="inline-flex self-start rounded-xl border border-slate-200 bg-white p-1" aria-label="Analytics time range">{Object.keys(ranges).map(option => <button key={option} onClick={()=>setRange(option)} aria-pressed={range === option} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${range === option ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}>{option}</button>)}</div></div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2"><ChartPanel title="Sales overview" subtitle={`${range} revenue trend · demo trend data`}><Line aria-label="Sales revenue trend line chart" options={lineOptions} data={salesData} /></ChartPanel><ChartPanel title="Revenue analytics" subtitle={`${range} revenue by period · demo trend data`}><Bar aria-label="Revenue by period bar chart" options={barOptions} data={revenueData} /></ChartPanel></div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_.8fr]"><ChartPanel title="Product performance" subtitle="Top products by units sold · demo data"><Bar aria-label="Top performing products horizontal bar chart" options={horizontalOptions} data={productData} /></ChartPanel><ChartPanel title="Order analytics" subtitle="Current order status mix · demo data"><Doughnut aria-label="Order status distribution doughnut chart" options={doughnutOptions} data={orderData} /></ChartPanel></div>
  </div>
}
