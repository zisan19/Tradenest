import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000,
})

// Request interceptor to dynamically inject the token on all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('[Axios Request Error]', error)
    return Promise.reject(error)
  }
)

// Response interceptor for transparent logging and session error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    const detail = error.response?.data?.detail || error.message
    console.warn(`[API Error] ${status || 'Network'} on ${url}:`, detail)

    // Optional: Clear token if session is decisively unauthorized on protected paths
    if (status === 401 && url !== '/api/auth/login' && url !== '/api/auth/register') {
      console.warn('Session expired or unauthorized. Clearing stored token.')
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    }
    return Promise.reject(error)
  }
)

api.setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }
}

export default api
