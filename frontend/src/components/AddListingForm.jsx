import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ApiService from '../services/api'

function AddListingForm({ onCancel, onSuccess }) {
  const { user } = useAuth()

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    address: '',
    distance_from_campus: '',
    contact_email: '',
    contact_phone: '',
    parking_type: 'none',
    amenities: [],
    lease_terms: [],
    available_date: ''
  })

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Available options
  const amenityOptions = [
    { value: 'parking', label: 'Parking' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'utilities_included', label: 'Utilities Included' },
    { value: 'furnished', label: 'Furnished' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'air_conditioning', label: 'Air Conditioning' },
    { value: 'heating', label: 'Heating' },
    { value: 'dishwasher', label: 'Dishwasher' },
    { value: 'microwave', label: 'Microwave' },
    { value: 'gym_access', label: 'Gym Access' },
    { value: 'pool', label: 'Pool' },
    { value: 'study_room', label: 'Study Room' },
    { value: 'pet_friendly', label: 'Pet Friendly' },
    { value: 'bike_storage', label: 'Bike Storage' },
    { value: 'shuttle_service', label: 'Shuttle Service' }
  ]

  const leaseTermOptions = [
    { value: 'semester', label: 'Semester' },
    { value: 'academic_year', label: 'Academic Year' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ]

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (error) setError('')
  }

  // Handle checkbox changes for amenities
  const handleAmenityChange = (amenityValue) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityValue)
        ? prev.amenities.filter(a => a !== amenityValue)
        : [...prev.amenities, amenityValue]
    }))
  }

  // Handle checkbox changes for lease terms
  const handleLeaseTermChange = (termValue) => {
    setFormData(prev => ({
      ...prev,
      lease_terms: prev.lease_terms.includes(termValue)
        ? prev.lease_terms.filter(t => t !== termValue)
        : [...prev.lease_terms, termValue]
    }))
  }

  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    if (!formData.description.trim()) {
      setError('Description is required')
      return false
    }
    if (!formData.price || isNaN(formData.price) || formData.price <= 0) {
      setError('Valid price is required')
      return false
    }
    if (!formData.bedrooms || isNaN(formData.bedrooms) || formData.bedrooms < 0) {
      setError('Valid number of bedrooms is required')
      return false
    }
    if (!formData.bathrooms || isNaN(formData.bathrooms) || formData.bathrooms < 0) {
      setError('Valid number of bathrooms is required')
      return false
    }
    if (!formData.address.trim()) {
      setError('Address is required')
      return false
    }
    return true
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        available_date: formData.available_date || undefined
      }

      // Make API call using ApiService instead of hardcoded localhost URL
      const result = await ApiService.request('/listings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(submitData)
      })
      
      // Success! Call the success callback
      onSuccess(result.listing)

    } catch (error) {
      console.error('Error creating listing:', error)
      setError(error.message || 'Failed to create listing. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Add New House Listing</h3>
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="e.g., Spacious 2BR Apartment Near UCR Campus"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={loading}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Describe the property, nearby amenities, transportation, etc."
                  required
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Full address including city and ZIP code"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="1200"
                  required
                />
              </div>

              {/* Distance from Campus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance from UCR Campus
                </label>
                <input
                  type="text"
                  name="distance_from_campus"
                  value={formData.distance_from_campus}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="e.g., 0.5 miles, 10 minute walk"
                />
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bedrooms *
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>

              {/* Bathrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bathrooms *
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  max="10"
                  step="0.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>

              {/* Parking Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parking Type
                </label>
                <select
                  name="parking_type"
                  value={formData.parking_type}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="none">No Parking</option>
                  <option value="street">Street Parking</option>
                  <option value="driveway">Driveway</option>
                  <option value="garage">Garage</option>
                  <option value="covered">Covered Parking</option>
                </select>
              </div>

              {/* Available Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Date
                </label>
                <input
                  type="date"
                  name="available_date"
                  value={formData.available_date}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Leave blank to use your account email"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {amenityOptions.map((amenity) => (
                  <label key={amenity.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.value)}
                      onChange={() => handleAmenityChange(amenity.value)}
                      disabled={loading}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">{amenity.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lease Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Lease Terms
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {leaseTermOptions.map((term) => (
                  <label key={term.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.lease_terms.includes(term.value)}
                      onChange={() => handleLeaseTermChange(term.value)}
                      disabled={loading}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <span className="text-sm text-gray-700">{term.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-blue-300 flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Creating Listing...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddListingForm 