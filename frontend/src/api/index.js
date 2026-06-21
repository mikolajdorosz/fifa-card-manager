/**
 * src/api/index.js — Skonfigurowana instancja Axios
 *
 * Automatycznie dołącza JWT token do każdego żądania.
 * Obsługuje błędy 401 (wylogowanie po wygaśnięciu tokenu).
 *
 * Użycie w komponentach/store:
 *   import api from '@/api'
 *   const { data } = await api.get('/cards')
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Dołącz token do każdego żądania
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Obsługa błędów globalnie
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
