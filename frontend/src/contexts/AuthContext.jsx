/**
 * Authentication Context - Global auth state management
 * - Stores current user data and authentication status
 * - Provides login/logout functions to all components
 * - Persists auth state in localStorage
 * - Auto-loads user data on app startup
 */
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // Current user object (null = not logged in)
  const [loading, setLoading] = useState(true) // Loading state during initialization

  // On mount: Check if user was previously logged in
  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user_data')
    
    // If both exist, restore user session
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        // Invalid data, clear storage
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
      }
    }
    setLoading(false)
  }, [])

  // Login function: Save user data and tokens to state + localStorage
  const login = (userData, tokens) => {
    setUser(userData)
    localStorage.setItem('access_token', tokens.access_token) // JWT for API requests
    localStorage.setItem('refresh_token', tokens.refresh_token) // For refreshing expired access tokens
    localStorage.setItem('user_data', JSON.stringify(userData)) // User profile data
  }

  // Logout function: Clear all auth data
  const logout = () => {
    setUser(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
  }

  const value = {
    user, // Current user object
    login, // Function to log user in
    logout, // Function to log user out
    loading, // Loading state (true while checking localStorage)
    isAuthenticated: !!user, // Boolean: is user logged in?
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to access auth context in any component
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

