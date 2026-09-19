import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'
import { normalizeRole, ROLE_HOME } from '../auth/roles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const setToken = (token) => {
    if (token) {
      localStorage.setItem('token', token)
      api.setAuthToken(token)
    } else {
      localStorage.removeItem('token')
      api.setAuthToken(null)
    }
  }

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return null
    }
    api.setAuthToken(token)
    try {
      const response = await api.get('/api/users/me')
      setUser(response.data)
      return response.data
    } catch (error) {
      console.warn('Failed to validate session token:', error)
      setToken(null)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const login = async (email, password) => {
    const cleanEmail = String(email || '').trim().toLowerCase()
    const response = await api.post('/api/auth/login', { email: cleanEmail, password })
    const { access_token, user: loggedInUser } = response.data
    setToken(access_token)
    
    let resolvedUser = loggedInUser
    if (resolvedUser) {
      setUser(resolvedUser)
    } else {
      resolvedUser = await fetchCurrentUser()
    }
    
    const userRole = normalizeRole(resolvedUser?.role)
    const homePath = ROLE_HOME[userRole] || '/dashboard'
    return {
      ...response.data,
      user: resolvedUser,
      role: userRole,
      roleHome: homePath,
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const role = normalizeRole(user?.role)
  const value = { user, role, roleHome: ROLE_HOME[role] || '/dashboard', login, logout, loading, isAuthenticated: !!user }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
