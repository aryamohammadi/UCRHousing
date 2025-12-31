import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AddListingForm from '../components/AddListingForm'
import EditListingForm from '../components/EditListingForm'
import ApiService from '../services/api'

function Dashboard() {
  const { user, token } = useAuth()
  
  // State for listings and UI
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingListing, setEditingListing] = useState(null)
  const [stats, setStats] = useState({
    activeListings: 0,
    totalViews: 0,
    totalListings: 0
  })

  // Fetch user's listings from API
  const fetchMyListings = async () => {
    try {
      setLoading(true)
      setError('')

      // Debug logging
      console.log('🔍 Dashboard: Fetching listings...')
      console.log('👤 User object:', user ? { email: user.email, name: user.name } : 'NO USER')
      console.log('🎫 Token from context:', token ? `Token exists (${token.length} chars)` : 'NO TOKEN')
      console.log('🎫 Token preview:', token ? `${token.substring(0, 20)}...${token.substring(token.length - 10)}` : 'NO TOKEN')

      if (!user || !token) {
        console.error('❌ No user or token available')
        console.error('User:', user)
        console.error('Token:', token)
        setError('Not logged in. Please log in again.')
        setLoading(false)
        return
      }

      // Use the getMyListings method which handles auth properly
      console.log('📡 Calling API: getMyListings with token')
      const data = await ApiService.getMyListings(token)
      console.log('✅ API response received:', { 
        hasListings: !!data.listings, 
        listingsCount: data.listings?.length || 0,
        success: data.success
      })
      
      // Handle both response formats: { listings: [...] } or { success: true, listings: [...] }
      const userListings = data.listings || data || []
      
      console.log('✅ Fetched listings:', userListings.length)
      setListings(userListings)
      
      // Calculate real stats from user's listings
      const activeCount = userListings.filter(listing => listing.status === 'active').length
      const totalViews = userListings.reduce((sum, listing) => sum + (listing.views || 0), 0)
      
      setStats({
        activeListings: activeCount,
        totalViews: totalViews,
        totalListings: userListings.length
      })

    } catch (error) {
      console.error('❌ Error fetching user listings:', error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Detailed error logging
      const errorDetails = {
        message: error.message,
        name: error.name,
        user: user ? { email: user.email, name: user.name } : 'NO USER',
        tokenPresent: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN'
      }
      console.error('Error details:', errorDetails)
      
      // Provide very specific error messages
      if (error.message.includes('token') || error.message.includes('Invalid token')) {
        console.error('🔴 Token-related error detected')
        setError('Your session has expired. Please log in again. (Token invalid)')
      } else if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Access denied')) {
        console.error('🔴 Authentication error detected')
        setError('Authentication failed. Please log in again. (401 Unauthorized)')
      } else if (error.message.includes('expired')) {
        console.error('🔴 Token expired')
        setError('Your session has expired. Please log in again. (Token expired)')
      } else {
        console.error('🔴 Unknown error')
        setError(`Unable to load your listings: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Load user's listings on component mount
  useEffect(() => {
    if (user) {
      fetchMyListings()
    }
  }, [user])

  // Handle listing status toggle
  const handleToggleStatus = async (listingId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      
      // Use ApiService instead of hardcoded localhost URL
      await ApiService.request(`/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      // Refresh listings after update
      fetchMyListings()
    } catch (error) {
      console.error('Error updating listing:', error)
      alert('Failed to update listing. Please try again.')
    }
  }

  // Handle listing deletion
  const handleDeleteListing = async (listingId, listingTitle) => {
    if (!confirm(`Are you sure you want to delete "${listingTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Use ApiService instead of hardcoded localhost URL
      await ApiService.request(`/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      // Refresh listings after deletion
      fetchMyListings()
    } catch (error) {
      console.error('Error deleting listing:', error)
      alert('Failed to delete listing. Please try again.')
    }
  }

  // Handle showing add listing form
  const handleShowAddForm = () => {
    setShowAddForm(true)
  }

  // Handle form cancellation
  const handleFormCancel = () => {
    setShowAddForm(false)
  }

  // Handle successful listing creation
  const handleFormSuccess = () => {
    setShowAddForm(false)
    // Refresh listings to show the new one
    fetchMyListings()
  }

  // Handle showing edit form
  const handleEditListing = (listing) => {
    setEditingListing(listing)
  }

  // Handle edit form cancellation
  const handleEditCancel = () => {
    setEditingListing(null)
  }

  // Handle successful listing edit
  const handleEditSuccess = () => {
    setEditingListing(null)
    // Refresh listings to show the updated one
    fetchMyListings()
  }

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">My Dashboard</h1>
              <p className="text-xl text-gray-400">
                Welcome back, {user?.name || user?.email}! Manage your house listings here.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded p-6 border border-white/20">
                <div className="flex items-center">
                  <div className="bg-white/20 w-16 h-16 rounded flex items-center justify-center mr-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{user?.name || 'Landlord'}</p>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 relative z-10">

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-navy-900 p-4">
            <div className="flex items-center justify-between">
              <div className="bg-white/20 w-12 h-12 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-white">
                <p className="text-2xl font-bold">
                  {loading ? '...' : stats.activeListings}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Active Listings</h3>
            <p className="text-sm text-gray-500">Currently available for rent</p>
          </div>
        </div>

        <div className="bg-white rounded shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
            <div className="flex items-center justify-between">
              <div className="bg-white/20 w-12 h-12 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="text-white">
                <p className="text-2xl font-bold">
                  {loading ? '...' : stats.totalViews}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Views</h3>
            <p className="text-sm text-gray-500">Student interest across all listings</p>
          </div>
        </div>

        <div className="bg-white rounded shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
            <div className="flex items-center justify-between">
              <div className="bg-white/20 w-12 h-12 rounded flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-white">
                <p className="text-2xl font-bold">
                  {loading ? '...' : stats.totalListings}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Listings</h3>
            <p className="text-sm text-gray-500">Properties you've posted</p>
          </div>
        </div>
      </div>

            {/* Main Actions */}
      <div className="bg-white rounded shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">My House Listings</h2>
              <p className="text-gray-600">Manage and track your rental properties</p>
            </div>
            <button
              onClick={handleShowAddForm}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Listing
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mb-4"></div>
              <p className="text-gray-600">Loading your listings...</p>
            </div>
          )}

          {/* Listings Table */}
          {!loading && !error && listings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Listing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price & Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing) => (
                    <tr key={listing._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {listing.address}
                          </div>
                          <div className="text-xs text-gray-400">
                            Created {formatDate(listing.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          ${listing.price.toLocaleString()}/month
                        </div>
                        <div className="text-sm text-gray-500">
                          {listing.bedrooms} bed • {listing.bathrooms} bath
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          listing.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {listing.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleStatus(listing._id, listing.status)}
                          className={`${
                            listing.status === 'active' 
                              ? 'text-orange-600 hover:text-orange-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {listing.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEditListing(listing)}
                          className="text-navy-900 hover:text-navy-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing._id, listing.title)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && listings.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4M8 7h8" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No listings yet</h3>
                <p className="text-gray-500 mb-6">Start by creating your first house listing to help UCR students find housing!</p>
                <button 
                  onClick={handleShowAddForm}
                  className="bg-navy-900 text-white px-6 py-2 rounded hover:bg-navy-800 font-medium"
                >
                  Create Your First Listing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Listing Form Modal */}
      {showAddForm && (
        <AddListingForm
          onCancel={handleFormCancel}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Edit Listing Form Modal */}
      {editingListing && (
        <EditListingForm
          listing={editingListing}
          onCancel={handleEditCancel}
          onSuccess={handleEditSuccess}
        />
      )}
      </div>
    </main>
  )
}

export default Dashboard 