import axios from 'axios'
import { API_CONFIG } from '../constants'

/**
 * Clean API client for Clerk integration
 * Token injection happens inside the React tree (App.jsx) via interceptors
 * Exponential backoff retry on 429 (rate limit) remains
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
  })

  // Response interceptor: Handle errors with retry logic
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (!originalRequest) return Promise.reject(error)

      // Prevent infinite retry loops
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0
      }

      // Handle 429 (Too Many Requests) with exponential backoff
      if (error.response?.status === 429 && originalRequest._retryCount < 3) {
        originalRequest._retryCount++
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000
        
        console.warn(`Rate limited (429). Retry ${originalRequest._retryCount}/3 after ${delay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return client(originalRequest)
      }

      // Handle network errors
      if (error.message === 'Network Error') {
        return Promise.reject({
          ...error,
          message: 'Network error. Please check your connection.',
        })
      }

      return Promise.reject(error)
    }
  )

  return client
}

const api = createApiClient()

export default api
