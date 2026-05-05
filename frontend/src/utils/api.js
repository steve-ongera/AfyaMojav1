import axios from 'axios'

// ─────────────────────────────────────────────
//  Base URL — reads from .env or falls back
// ─────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// ─────────────────────────────────────────────
//  Axios instance
// ─────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ─────────────────────────────────────────────
//  Request interceptor — attach JWT
// ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ─────────────────────────────────────────────
//  Response interceptor — handle 401 + refresh
// ─────────────────────────────────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // If 401 and not already retrying
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry  = true
      isRefreshing     = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })
        localStorage.setItem('access_token', data.access)
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh)

        api.defaults.headers.common.Authorization = `Bearer ${data.access}`
        original.headers.Authorization            = `Bearer ${data.access}`
        processQueue(null, data.access)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─────────────────────────────────────────────
//  Helper — extract readable error message
// ─────────────────────────────────────────────
export const getErrorMessage = (err) => {
  if (!err.response) return 'Network error. Check your connection.'
  const data = err.response.data
  if (typeof data === 'string') return data
  if (data?.detail)            return data.detail
  if (data?.non_field_errors)  return data.non_field_errors[0]
  // Field-level errors
  const firstKey = Object.keys(data)[0]
  if (firstKey) {
    const msg = data[firstKey]
    return `${firstKey}: ${Array.isArray(msg) ? msg[0] : msg}`
  }
  return `Error ${err.response.status}`
}

// ─────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────
export const authAPI = {
  login:   (data)   => api.post('/auth/login/', data),
  logout:  (data)   => api.post('/auth/logout/', data),
  refresh: (data)   => api.post('/auth/refresh/', data),
  me:      ()       => api.get('/auth/me/'),
}

// ─────────────────────────────────────────────
//  PATIENTS
// ─────────────────────────────────────────────
export const patientAPI = {
  list:   (params) => api.get('/patients/', { params }),
  get:    (id)     => api.get(`/patients/${id}/`),
  create: (data)   => api.post('/patients/', data),
  update: (id, data) => api.patch(`/patients/${id}/`, data),
}

// ─────────────────────────────────────────────
//  VISITS
// ─────────────────────────────────────────────
export const visitAPI = {
  list:         (params)   => api.get('/visits/', { params }),
  get:          (id)       => api.get(`/visits/${id}/`),
  create:       (data)     => api.post('/visits/', data),
  update:       (id, data) => api.patch(`/visits/${id}/`, data),
  updateStatus: (id, status) => api.patch(`/visits/${id}/status/`, { status }),
}

// ─────────────────────────────────────────────
//  TRIAGE
// ─────────────────────────────────────────────
export const triageAPI = {
  list:   (params)   => api.get('/triage/', { params }),
  get:    (id)       => api.get(`/triage/${id}/`),
  create: (data)     => api.post('/triage/', data),
  update: (id, data) => api.patch(`/triage/${id}/`, data),
}

// ─────────────────────────────────────────────
//  MEDICAL RECORDS
// ─────────────────────────────────────────────
export const recordAPI = {
  list:   (params)   => api.get('/records/', { params }),
  get:    (id)       => api.get(`/records/${id}/`),
  create: (data)     => api.post('/records/', data),
  update: (id, data) => api.patch(`/records/${id}/`, data),
}

// ─────────────────────────────────────────────
//  MEDICINES
// ─────────────────────────────────────────────
export const medicineAPI = {
  list:   (params)   => api.get('/medicines/', { params }),
  get:    (id)       => api.get(`/medicines/${id}/`),
  create: (data)     => api.post('/medicines/', data),
  update: (id, data) => api.patch(`/medicines/${id}/`, data),
  delete: (id)       => api.delete(`/medicines/${id}/`),
}

// ─────────────────────────────────────────────
//  SHA / INSURANCE RECORDS
// ─────────────────────────────────────────────
export const shaAPI = {
  list:         (params)   => api.get('/sha-records/', { params }),
  get:          (id)       => api.get(`/sha-records/${id}/`),
  create:       (data)     => api.post('/sha-records/', data),
  updateStatus: (id, data) => api.patch(`/sha-records/${id}/`, data),
}

// ─────────────────────────────────────────────
//  USERS (admin)
// ─────────────────────────────────────────────
export const userAPI = {
  list:   (params)   => api.get('/users/', { params }),
  get:    (id)       => api.get(`/users/${id}/`),
  create: (data)     => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id)       => api.delete(`/users/${id}/`),
}

// ─────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats/'),
}

export default api