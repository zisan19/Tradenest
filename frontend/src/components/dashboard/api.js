import api from '../../api/axios'

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Resolve an image URL for display. Uploads served by the backend
 * ("/uploads/...") need the API origin in dev — Vite has no such route
 * and would answer with the SPA fallback instead of image bytes.
 */
export function imageUrl(url) {
  if (!url) return url
  if (url.startsWith('/uploads/')) return API_ORIGIN + url
  return url
}

/**
 * Thin helpers over the shared axios instance for dashboard pages.
 * extractError turns FastAPI's { detail: "..." } into a friendly string.
 */
export function extractError(err, fallback = 'Request failed') {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const first = detail[0]
    return first?.msg ? `${first.msg}` : fallback
  }
  return err?.message || fallback
}

export async function fetchJson(url, config) {
  try {
    const response = await api.get(url, config)
    return { data: response.data, error: null }
  } catch (err) {
    return { data: null, error: extractError(err) }
  }
}

export default api
