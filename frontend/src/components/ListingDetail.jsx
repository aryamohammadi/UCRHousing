import React from 'react'

function ListingDetail({ listing, onClose }) {
  if (!listing) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-4xl shadow-2xl rounded bg-white">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{listing.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Photos Gallery */}
        {listing.photos && listing.photos.length > 0 ? (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listing.photos.map((photo, index) => (
                <div key={index} className="relative h-64 rounded overflow-hidden">
                  <img
                    src={photo}
                    alt={`${listing.title} - Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 h-64 bg-navy-900 rounded flex items-center justify-center">
            <div className="text-white text-center">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <p className="text-sm font-medium opacity-90">No photos available</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2">
            {/* Price and Key Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-4xl font-bold text-gray-900">
                    ${listing.price.toLocaleString()}
                  </p>
                  <p className="text-gray-600">per month</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-gray-900">
                    {listing.bedrooms} BR / {listing.bathrooms} BA
                  </p>
                  <p className="text-sm text-gray-600">Bedrooms / Bathrooms</p>
                </div>
              </div>
            </div>

            {/* Full Description */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full border border-blue-200"
                    >
                      {amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lease Terms */}
            {listing.lease_terms && listing.lease_terms.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Available Lease Terms</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.lease_terms.map((term) => (
                    <span
                      key={term}
                      className="bg-green-50 text-green-700 text-sm font-medium px-4 py-2 rounded-full border border-green-200"
                    >
                      {term.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            {/* Location */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Location</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-700 text-sm">{listing.address}</p>
                </div>
                {listing.distance_from_campus && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-blue-600 text-sm font-medium">{listing.distance_from_campus} from UCR</p>
                  </div>
                )}
                {listing.parking_type && listing.parking_type !== 'none' && (
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-700 text-sm capitalize">{listing.parking_type} Parking</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm font-bold">
                      {(listing.landlord?.name || 'L').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {listing.landlord?.name || 'Landlord'}
                    </p>
                  </div>
                </div>
                {listing.contact_email && (
                  <div className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${listing.contact_email}`} className="text-sm hover:text-blue-600">
                      {listing.contact_email}
                    </a>
                  </div>
                )}
                {listing.contact_phone && (
                  <div className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${listing.contact_phone}`} className="text-sm hover:text-blue-600">
                      {listing.contact_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Property Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900 capitalize">{listing.status}</span>
                </div>
                {listing.available_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(listing.available_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Views:</span>
                  <span className="font-medium text-gray-900">{listing.views || 0}</span>
                </div>
                {listing.featured && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Featured:</span>
                    <span className="font-medium text-green-600">Yes</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-400 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ListingDetail

