import React, { createContext, useContext, useState, useEffect } from 'react'

// Create the authentication context
const AuthContext = createContext()

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    const initializeAuth = () => {
      try {
        console.log('🔐 AuthContext: Initializing auth from localStorage')
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')
        
        console.log('🔐 AuthContext: Stored token present:', !!storedToken)
        console.log('🔐 AuthContext: Stored user present:', !!storedUser)
        
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser)
          console.log('🔐 AuthContext: Restoring auth state', {
            userEmail: parsedUser.email,
            tokenLength: storedToken.length,
            tokenPreview: `${storedToken.substring(0, 20)}...`
          })
          setToken(storedToken)
          setUser(parsedUser)
        } else {
          console.log('🔐 AuthContext: No stored auth data found')
        }
      } catch (error) {
        console.error('❌ AuthContext: Error initializing auth:', error)
        // Clear corrupted data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = (userData, authToken) => {
    try {
      console.log('🔐 AuthContext: Login called', {
        userEmail: userData?.email,
        tokenLength: authToken?.length,
        tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'NO TOKEN'
      })
      
      setUser(userData)
      setToken(authToken)
      
      // Store in localStorage for persistence
      localStorage.setItem('auth_token', authToken)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      
      console.log('✅ AuthContext: Auth data stored successfully')
    } catch (error) {
      console.error('❌ AuthContext: Error storing auth data:', error)
    }
  }

  // Logout function
  const logout = () => {
    setUser(null)
    setToken(null)
    
    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!(user && token)
  }

  // Get authorization header for API requests
  const getAuthHeader = () => {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    getAuthHeader
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 