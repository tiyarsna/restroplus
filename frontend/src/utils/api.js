import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({ baseURL: BASE_URL, timeout: 15000, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rp_token')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    if (error.code === 'ERR_NETWORK') console.error('Backend not running at', BASE_URL)
    return Promise.reject(error)
  }
)

export default api