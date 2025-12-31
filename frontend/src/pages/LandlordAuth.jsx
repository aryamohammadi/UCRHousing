import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ApiService from '../services/api'

function LandlordAuth() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard'

  // Check if user is already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated()) {
      // User is already logged in, redirect to dashboard
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate])

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-lg shadow-md border">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </main>
    )
  }

  // Don't render the form if user is authenticated (they'll be redirected)
  if (isAuthenticated()) {
    return null
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  // Form validation
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required')
      return false
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    return true
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        // Login flow
        const response = await ApiService.login({
          email: formData.email,
          password: formData.password
        })

        // Store authentication data
        login(response.landlord, response.token)
        
        setSuccess('Login successful! Redirecting...')
        
        // Redirect after a brief success message
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 1500)

      } else {
        // Registration flow
        const registrationData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone
        }

        const response = await ApiService.register(registrationData)
        
        // Store authentication data
        login(response.landlord, response.token)
        
        setSuccess('Account created successfully! Redirecting...')
        
        // Redirect after a brief success message
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 1500)
      }

    } catch (error) {
      console.error('Authentication error:', error)
      setError(error.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Toggle between login and register
  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setSuccess('')
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: ''
    })
  }

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white p-8 rounded-lg shadow-md border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Landlord Login' : 'Landlord Signup'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to manage your listings' : 'Create an account to post listings'}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-400 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-400 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Registration-only fields */}
          {!isLogin && (
            <>
              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-400 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-400 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="John Doe"
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-400 rounded focus:ring-2 focus:ring-navy-700 focus:border-navy-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="(555) 123-4567"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-900 text-white py-2 px-4 rounded hover:bg-navy-800 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle Button */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            disabled={loading}
            className="text-navy-900 hover:text-navy-900 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>
      </div>
    </main>
  )
}

export default LandlordAuth 