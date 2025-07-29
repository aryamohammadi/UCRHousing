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
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Server gave us an error, pass it along
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      // Handle when internet is down or server is unreachable
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.')
      }
      
      // Pass the error up to whoever called this function
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

  async getCurrentUser(token) {
    return this.request('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  // Listings stuff - CRUD operations for housing posts
  async getListings(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/listings?${queryString}` : '/listings'
    return this.request(endpoint)
  }

  async getListing(id) {
    return this.request(`/listings/${id}`)
  }

  async createListing(listingData, token) {
    return this.request('/listings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(listingData),
    })
  }

  async updateListing(id, listingData, token) {
    return this.request(`/listings/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(listingData),
    })
  }

  async deleteListing(id, token) {
    return this.request(`/listings/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  // Just checks if the server is alive - useful for debugging
  async healthCheck() {
    return this.request('/health')
  }
}

// Create one instance and export it everywhere - saves memory
export default new ApiService() 