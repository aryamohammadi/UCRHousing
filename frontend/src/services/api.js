// API base URL - switches between dev and production automatically
// Priority: 1. VITE_API_URL env var, 2. Default to localhost for dev, 3. Fallback to production
const getApiBaseUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // In development mode (Vite default), use localhost
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return 'http://localhost:3001/api'
  }
  
  // Production fallback (only if explicitly in production mode)
  return 'https://backend-api-production-cc33.up.railway.app/api'
}

const API_BASE_URL = getApiBaseUrl()

// Log the API base URL on module load for debugging
console.log('🔧 API Base URL configured:', API_BASE_URL)

// API service class - basically handles all our HTTP requests so we don't repeat code
class ApiService {
  
  // Helper method to make HTTP requests - does the heavy lifting
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`)
      console.log('📋 Request headers:', {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers['Authorization'] ? `${config.headers['Authorization'].substring(0, 30)}...` : 'NOT SET'
      })
      
      // Log body for POST/PUT/PATCH requests
      if (config.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
        console.log('📦 Request body present:', !!config.body)
        console.log('📦 Request body type:', typeof config.body)
        if (typeof config.body === 'string') {
          try {
            const bodyObj = JSON.parse(config.body)
            console.log('📦 Request body keys:', Object.keys(bodyObj))
            console.log('📦 Request body preview:', JSON.stringify(bodyObj).substring(0, 200))
          } catch (e) {
            console.log('📦 Request body (raw):', config.body.substring(0, 200))
          }
        }
      }
      
      const response = await fetch(url, config)
      console.log(`📥 Response status: ${response.status} ${response.statusText}`)
      
      // Try to get response data
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        throw new Error('Server returned invalid response format')
      }

      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`)
        console.error('Error response data:', data)
        
        // More specific error handling based on status codes
        if (response.status === 401) {
          const errorMsg = data.error || 'Authentication failed'
          const debugMsg = data.debug ? ` (${data.debug})` : ''
          console.error('🔴 401 Unauthorized:', errorMsg, debugMsg)
          throw new Error(`${errorMsg}${debugMsg}`)
        } else if (response.status === 403) {
          throw new Error(data.error || 'Access denied. Please check your connection and try again.')
        } else if (response.status === 409) {
          throw new Error(data.error || 'An account with this email already exists')
        } else if (response.status === 400) {
          throw new Error(data.error || 'Please check your input and try again')
        } else if (response.status === 500) {
          throw new Error(data.error || 'Server error. Please try again in a few moments.')
        } else {
          throw new Error(data.error || `Request failed (${response.status})`)
        }
      }

      return data
    } catch (error) {
      // Network or CORS errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('❌ Network error:', {
          url,
          apiBaseUrl: API_BASE_URL,
          error: error.message
        })
        
        // Provide more helpful error message based on the API URL
        if (API_BASE_URL.includes('localhost')) {
          throw new Error('Unable to connect to local backend server. Make sure the backend is running on http://localhost:3001')
        } else {
          throw new Error(`Unable to connect to API server at ${API_BASE_URL}. Please check your internet connection and ensure the backend service is running.`)
        }
      }
      
      // CORS errors (often show as network errors)
      if (error.message.includes('CORS') || error.message.includes('blocked')) {
        console.error('❌ CORS error:', {
          url,
          apiBaseUrl: API_BASE_URL,
          error: error.message
        })
        throw new Error('Connection blocked by CORS policy. Please check backend CORS configuration.')
      }
      
      // Pass through our custom errors
      throw error
    }
  }

  // Auth stuff - login, register, etc.
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  // Listings
  async getListings(params = {}) {
    const searchParams = new URLSearchParams(params)
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/listings?${queryString}` : '/listings'
    return this.request(endpoint)
  }

  async createListing(listingData, token) {
    return this.request('/listings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(listingData),
    })
  }

  async updateListing(id, listingData, token) {
    return this.request(`/listings/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(listingData),
    })
  }

  async deleteListing(id, token) {
    return this.request(`/listings/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      },
    })
  }

  // Get landlord's own listings
  async getMyListings(token) {
    return this.request('/listings/my', {
      headers: {
        Authorization: `Bearer ${token}`
      },
    })
  }

  // Toggle listing status
  async toggleListingStatus(id, token) {
    return this.request(`/listings/${id}/toggle`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
    })
  }
}

export default new ApiService() 