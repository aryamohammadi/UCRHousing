import React, { useState, useEffect } from 'react'
import ApiService from '../services/api'

function Listings() {
  // State for listings and UI
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({})

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [bedrooms, setBedrooms] = useState('')

  // Fetch listings from API
  const fetchListings = async (filters = {}) => {
    try {
      setLoading(true)
      setError('')

      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim())
      }
      
      if (filters.bedrooms) {
        params.append('bedrooms', filters.bedrooms)
      }
      
      // Handle price range
      if (filters.priceRange) {
        switch (filters.priceRange) {
          case 'under1000':
            params.append('maxPrice', '1000')
            break
          case '1000-1500':
            params.append('minPrice', '1000')
            params.append('maxPrice', '1500')
            break
          case '1500-2000':
            params.append('minPrice', '1500')
            params.append('maxPrice', '2000')
            break
          case 'over2000':
            params.append('minPrice', '2000')
            break
        }
      }

      // Make API call
      const response = await ApiService.getListings(Object.fromEntries(params))
      
      setListings(response.listings || [])
      setPagination(response.pagination || {})

    } catch (error) {
      console.error('Error fetching listings:', error)
      setError('Unable to load listings. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Load listings on component mount
  useEffect(() => {
    fetchListings()
  }, [])

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault()
    const filters = {
      search: searchTerm,
      priceRange: priceRange,
      bedrooms: bedrooms
    }
    fetchListings(filters)
  }

  // Reset filters
  const handleReset = () => {
    setSearchTerm('')
    setPriceRange('')
    setBedrooms('')
    fetchListings()
  }



  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Available Housing</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Discover quality off-campus housing options near UC Riverside
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 -mt-8 relative z-10">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Properties
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by location, property type, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="">Any Price</option>
                <option value="under1000">Under $1,000</option>
                <option value="1000-1500">$1,000 - $1,500</option>
                <option value="1500-2000">$1,500 - $2,000</option>
                <option value="over2000">Over $2,000</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="">Any Bedrooms</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Use filters to find your perfect housing match
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Summary */}
      {!loading && !error && (
        <div className="mb-6">
          <p className="text-gray-600">
            {pagination.total === 0 
              ? 'No listings found' 
              : `Showing ${listings.length} of ${pagination.total} listings`
            }
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading listings...</p>
        </div>
      )}

            {/* Listings Grid */}
      {!loading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing) => (
            <div key={listing._id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group hover:-translate-y-1">
              {/* Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <svg className="w-16 h-16 mx-auto mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <p className="text-sm font-medium opacity-90">{listing.bedrooms} Bed • {listing.bathrooms} Bath</p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className="bg-white/90 backdrop-blur-sm text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-blue-200">
                    {listing.status === 'active' ? 'Available' : listing.status}
                  </span>
                </div>

                {/* Price Badge */}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                    <p className="text-2xl font-bold text-gray-900">
                      ${listing.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 -mt-1">per month</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {listing.title}
                </h3>

                {/* Location */}
                <div className="flex items-start mb-4 space-y-1">
                  <div className="w-full">
                    <div className="flex items-center text-gray-600 mb-1">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">{listing.address}</span>
                    </div>
                    {listing.distance_from_campus && (
                      <div className="flex items-center text-blue-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        <span className="text-sm font-medium">{listing.distance_from_campus} from UCR</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                  {listing.description}
                </p>

                {/* Amenities */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {listing.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200">
                          {amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                      {listing.amenities.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                          +{listing.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact & Stats */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-bold">
                        {(listing.landlord?.name || 'Landlord').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {listing.landlord?.name || 'Landlord'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {listing.contact_email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm">{listing.views || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No listings found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || priceRange || bedrooms 
                ? 'Try adjusting your search filters to find more results.'
                : 'Be the first to post a listing! Landlords can sign up to add housing options for UCR students.'
              }
            </p>
            {(searchTerm || priceRange || bedrooms) && (
              <button 
                onClick={handleReset}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </main>
  )
}

export default Listings 