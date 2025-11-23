// API base URL - switches between dev and production automatically 
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-api-production-cc33.up.railway.app/api'

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
      const response = await fetch(url, config)
      
      // Try to get response data
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError)
        throw new Error('Server returned invalid response format')
      }

      if (!response.ok) {
        // More specific error handling based on status codes
        if (response.status === 403) {
          throw new Error(data.error || 'Access denied. Please check your connection and try again.')
        } else if (response.status === 409) {
          throw new Error(data.error || 'An account with this email already exists')
        } else if (response.status === 400) {
          throw new Error(data.error || 'Please check your input and try again')
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again in a few moments.')
        } else {
          throw new Error(data.error || `Request failed (${response.status})`)
        }
      }

      return data
    } catch (error) {
      // Network or CORS errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to our servers. Please check your internet connection and try again.')
      }
      
      // CORS errors (often show as network errors)
      if (error.message.includes('CORS') || error.message.includes('blocked')) {
        throw new Error('Connection error. Please try refreshing the page.')
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