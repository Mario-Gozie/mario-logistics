/**
 * axios.js — Pre-configured Axios instance
 *
 * HOW JWT WORKS HERE:
 * When a user logs in, the backend returns a JWT token (a long encoded string).
 * We save that token in localStorage.
 * Every time we make an API request, this file automatically adds the token
 * to the request header as:  Authorization: Bearer <token>
 * The backend reads that header, verifies it, and knows who you are.
 * If the token is expired or missing, the backend returns 401 and we log out.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// REQUEST interceptor — attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ml_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// RESPONSE interceptor — if backend says 401 (unauthorized), log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ml_token')
      localStorage.removeItem('ml_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
