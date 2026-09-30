import React from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
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

/**
 * Shared Chart.js wrappers so every dashboard chart gets identical styling,
 * animation and tooltip treatment. Register chart components once, here.
 */

const axis = {
  border: { display: false },
  grid: { color: '#eef2ff' },
  ticks: { color: '#94a3b8', font: { size: 11 } },
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 750, easing: 'easeOutQuart' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0b1220',
      padding: 12,
      displayColors: false,
      cornerRadius: 10,
    },
  },
}

export function ChartCard({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`card min-w-0 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-space text-lg font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="h-64 min-w-0">{children}</div>
    </section>
  )
}

export function TrendLine({ labels, data, label = 'Revenue', prefix = '$' }) {
  const options = {
    ...baseOptions,
    scales: { x: { ...axis, grid: { display: false } }, y: { ...axis, beginAtZero: true } },
    plugins: {
      ...baseOptions.plugins,
      tooltip: { ...baseOptions.plugins.tooltip, callbacks: { label: (ctx) => `${prefix}${ctx.parsed.y?.toLocaleString?.() ?? ctx.parsed.y}` } },
    },
  }
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,.13)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1',
      },
    ],
  }
  return <Line options={options} data={chartData} />
}

export function BarsChart({ labels, data, label = 'Value', color = '#6366f1', prefix = '$', horizontal = false }) {
  const options = {
    ...baseOptions,
    indexAxis: horizontal ? 'y' : 'x',
    scales: horizontal
      ? { x: { ...axis, beginAtZero: true }, y: { ...axis, grid: { display: false } } }
      : { x: { ...axis, grid: { display: false } }, y: { ...axis, beginAtZero: true } },
    plugins: {
      ...baseOptions.plugins,
      tooltip: { ...baseOptions.plugins.tooltip, callbacks: { label: (ctx) => `${prefix}${ctx.parsed[horizontal ? 'x' : 'y']?.toLocaleString?.() ?? ''}` } },
    },
  }
  const chartData = {
    labels,
    datasets: [{ label, data, backgroundColor: color, borderRadius: 8, maxBarThickness: 36 }],
  }
  return <Bar options={options} data={chartData} />
}

export function DonutChart({ labels, data, colors, prefix = '' }) {
  const options = {
    ...baseOptions,
    cutout: '70%',
    plugins: {
      ...baseOptions.plugins,
      legend: { display: true, position: 'bottom', labels: { color: '#64748b', boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11 } } },
      tooltip: {
        ...baseOptions.plugins.tooltip,
        displayColors: true,
        callbacks: { label: (ctx) => ` ${ctx.label}: ${prefix}${String(ctx.parsed).toLocaleString?.() ?? ctx.parsed}` },
      },
    },
  }
  const chartData = {
    labels,
    datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }],
  }
  return <Doughnut options={options} data={chartData} />
}

/** Shared status palette used by donut charts across dashboards. */
export const STATUS_COLORS = {
  pending: '#fbbf24',
  confirmed: '#818cf8',
  shipped: '#22d3ee',
  delivered: '#10b981',
  cancelled: '#fb7185',
}
