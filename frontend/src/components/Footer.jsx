import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-[#1e3a5f] text-white py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-6 md:space-y-8">
          {/* Brand */}
          <div>
            <div className="flex items-center justify-center mb-3">
              <div className="bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="text-lg font-bold">DormDuos</div>
            </div>
            <p className="text-sm text-white/70">
              A housing platform for UC Riverside students
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
            <Link to="/" className="text-white/80 hover:text-white transition-colors min-h-[44px] flex items-center">
              Home
            </Link>
            <span className="text-white/40 hidden sm:inline">•</span>
            <Link to="/listings" className="text-white/80 hover:text-white transition-colors min-h-[44px] flex items-center">
              Browse Listings
            </Link>
            <span className="text-white/40 hidden sm:inline">•</span>
            <Link to="/landlord" className="text-white/80 hover:text-white transition-colors min-h-[44px] flex items-center">
              Post a Listing
            </Link>
            <span className="text-white/40 hidden sm:inline">•</span>
            <Link to="/dashboard" className="text-white/80 hover:text-white transition-colors min-h-[44px] flex items-center">
              Dashboard
            </Link>
          </nav>

          {/* Legal Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <Link to="/privacy" className="text-white/60 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/40">•</span>
            <Link to="/terms" className="text-white/60 hover:text-white transition-colors">
              Terms
            </Link>
          </div>

          {/* Credits */}
          <div className="pt-6 border-t border-white/10 space-y-2">
            <p className="text-sm text-white/60">
              In partnership with <span className="font-medium text-white/80">HighlanderHousing</span>
            </p>
            <p className="text-sm text-white/60">
              Contact: <a href="mailto:dormduos@gmail.com" className="text-white/60 hover:text-white transition-colors">dormduos@gmail.com</a>
            </p>
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} DormDuos
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 