/**
 * AuthContext.jsx
 *
 * This file makes the logged-in user available everywhere in the app
 * without having to pass it as props through every component.
 *
 * Usage in any component:
 *   const { user, login, logout } = useAuth()
 */

import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load, check if there's already a saved token and restore session
  useEffect(() => {
    const saved = localStorage.getItem('ml_user')
    if (saved) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  // Called after successful login — saves token + user to localStorage
  const login = (token, userData) => {
    localStorage.setItem('ml_token', token)
    localStorage.setItem('ml_user', JSON.stringify(userData))
    setUser(userData)
  }

  // Called on logout — clears everything
  const logout = () => {
    localStorage.removeItem('ml_token')
    localStorage.removeItem('ml_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — import this in any component that needs auth
export const useAuth = () => useContext(AuthContext)
