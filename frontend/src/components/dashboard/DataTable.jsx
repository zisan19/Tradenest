import React, { useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi'

/**
 * DataTable — reusable table with built-in client-side search, sorting and
 * pagination, plus loading skeletons and empty/error states.
 *
 * columns: [{ key, header, render?(row), sortable?, className?, sortValue?(row) }]
 * rows:    array of objects
 */
export default function DataTable({
  columns,
  rows = [],
  loading = false,
  error = null,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'Records will appear here as activity happens.',
  emptyIcon,
  searchable = true,
  searchKeys = null, // defaults to all string columns
  pageSize = 8,
  onRowClick,
  toolbar = null,
  getRowKey = (row, i) => row.id ?? i,
}) {
  const reduceMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)

  const searchableKeys = useMemo(() => {
    if (searchKeys) return searchKeys
    return columns.filter((c) => !c.render).map((c) => c.key)
  }, [columns, searchKeys])

  const filtered = useMemo(() => {
    let data = rows
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      data = data.filter((row) =>
        searchableKeys.some((key) => {
          const value = key.split('.').reduce((obj, k) => (obj ? obj[k] : undefined), row)
          return String(value ?? '').toLowerCase().includes(q)
        })
      )
    }
    if (sort.key) {
      const col = columns.find((c) => c.key === sort.key)
      data = [...data].sort((a, b) => {
        const va = col?.sortValue ? col.sortValue(a) : a[sort.key]
        const vb = col?.sortValue ? col.sortValue(b) : b[sort.key]
        if (va == null) return 1
        if (vb == null) return -1
        if (typeof va === 'number' && typeof vb === 'number') return sort.dir === 'asc' ? va - vb : vb - va
        return sort.dir === 'asc'
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va))
      })
    }
    return data
  }, [rows, query, sort, columns, searchableKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const toggleSort = (key) => {
    setPage(1)
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    )
  }

  return (
    <div className="card min-w-0 p-0">
      {(searchable || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative w-full sm:max-w-xs">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60"
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-semibold ${col.className || ''}`}>
                  {col.sortable === false ? (
                    col.header
                  ) : (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 transition hover:text-slate-600"
                    >
                      {col.header}
                      {sort.key === col.key &&
                        (sort.dir === 'asc' ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />)}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }, (_, i) => (
                <tr key={`sk-${i}`} className="border-b border-slate-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="shimmer h-4 w-4/5 rounded" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading && error && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-sm font-bold text-rose-600">Something went wrong</p>
                  <p className="mt-1 text-xs text-slate-500">{String(error)}</p>
                </td>
              </tr>
            )}

            {!loading && !error && pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                    {emptyIcon || <FiSearch size={20} />}
                  </div>
                  <p className="mt-3 font-space text-base font-bold text-ink">{emptyTitle}</p>
                  <p className="mt-1 text-sm text-slate-500">{emptyMessage}</p>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              pageRows.map((row, i) => (
                <motion.tr
                  key={getRowKey(row, i)}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: i * 0.03 }}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-slate-50 transition-colors last:border-0 hover:bg-indigo-50/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3.5 ${col.className || ''}`}>
                      {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-xs font-medium text-slate-400">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of{' '}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <FiChevronLeft size={15} />
            </button>
            <span className="px-2 text-xs font-bold text-slate-600">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <FiChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
