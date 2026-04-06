import axios from 'axios'

// We ensure the base URL always points to the '/api' endpoints
let BASE_URL = import.meta.env.VITE_API_URL || 'https://restroplus.onrender.com'
if (!BASE_URL.endsWith('/api')) {
  BASE_URL = BASE_URL.replace(/\/$/, '') + '/api'
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true, // ✅ important for CORS
  headers: {
    'Content-Type': 'application/json'
  }
})

// ✅ Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rp_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rp_token')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Backend not reachable:', BASE_URL)
    }

    return Promise.reject(error)
  }
)

export default api