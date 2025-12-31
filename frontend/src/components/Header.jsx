import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false) // Close menu on logout
  }

  // Check if current path is active
  const isActive = (path) => {
    return location.pathname === path
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-navy-900 w-10 h-10 rounded flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-navy-900">
                DormDuos
              </div>
              <div className="text-xs text-gray-500 -mt-1">Find Housing</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-gray-100 text-navy-900'
                  : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/listings"
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isActive('/listings')
                  ? 'bg-gray-100 text-navy-900'
                  : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
              }`}
            >
              View Listings
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-gray-100 text-navy-900'
                      : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="flex items-center ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center">
                    <div className="bg-navy-900 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'Landlord'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="border border-gray-400 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/landlord"
                className={`ml-4 px-6 py-2.5 bg-navy-900 text-white rounded text-sm font-medium hover:bg-navy-800 transition-colors ${
                  isActive('/landlord') ? 'ring-2 ring-gray-400' : ''
                }`}
              >
                Post a Listing
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600 p-2"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - conditionally rendered */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded text-sm font-medium ${
                isActive('/')
                  ? 'bg-gray-100 text-navy-900'
                  : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/listings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded text-sm font-medium ${
                isActive('/listings')
                  ? 'bg-gray-100 text-navy-900'
                  : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
              }`}
            >
              View Listings
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'bg-gray-100 text-navy-900'
                      : 'text-gray-600 hover:text-navy-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center px-3 py-2">
                    <div className="bg-navy-900 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'Landlord'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/landlord"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded text-sm font-medium bg-navy-900 text-white hover:bg-navy-800 text-center transition-colors ${
                  isActive('/landlord') ? 'ring-2 ring-gray-400' : ''
                }`}
              >
                Post a Listing
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header 