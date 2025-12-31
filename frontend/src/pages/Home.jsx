import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-navy-900 to-navy-800 text-white py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight text-white" style={{
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              DormDuos
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              The trusted housing platform for UC Riverside students. Find verified listings and connect with landlords near campus.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mb-12 w-full sm:w-auto">
              <Link
                to="/listings"
                className="bg-gold-500 hover:bg-gold-600 text-[#1A1A1A] px-8 py-4 rounded-lg font-semibold transition-colors duration-200 min-h-[44px] flex items-center justify-center w-full sm:w-auto"
              >
                Browse Listings
              </Link>
              
              <Link
                to="/landlord"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#1e3a5f] transition-colors duration-200 min-h-[44px] flex items-center justify-center w-full sm:w-auto"
              >
                Post a Listing
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-white/80 px-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>UCR Student Community</span>
              </div>
              <span className="hidden sm:inline text-white/40">•</span>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Free to Use</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why DormDuos Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1A1A1A] text-center tracking-tight mb-8 sm:mb-12">
            Why Students Trust DormDuos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Card 1 - UCR-Focused */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
              <svg 
                className="h-8 w-8 text-[#1e3a5f] mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <h3 className="font-semibold text-lg text-[#1A1A1A] mb-4">
                Made for UCR
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Listings are specifically for UC Riverside students looking for off-campus housing near campus.
              </p>
            </div>

            {/* Card 2 - Student-Built */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
              <svg 
                className="h-8 w-8 text-[#1e3a5f] mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
              <h3 className="font-semibold text-lg text-[#1A1A1A] mb-4">
                Built by a Student
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Created by a UCR student who understands the housing search struggle firsthand.
              </p>
            </div>

            {/* Card 3 - Free to Use */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
              <svg 
                className="h-8 w-8 text-[#1e3a5f] mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3 className="font-semibold text-lg text-[#1A1A1A] mb-4">
                100% Free
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                No fees, no subscriptions. Browse listings and connect with landlords at no cost.
              </p>
            </div>

            {/* Card 4 - Independent Platform */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
              <svg 
                className="h-8 w-8 text-[#1e3a5f] mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3 className="font-semibold text-lg text-[#1A1A1A] mb-4">
                Independent Platform
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                DormDuos is not affiliated with UC Riverside. This is a student-created resource to help with your housing search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Discord Section */}
      <section className="py-16 md:py-24 bg-[#F9FAFB]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 text-center">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#1A1A1A] mb-4 tracking-tight">
              Connect with Fellow Students
            </h3>
            <p className="text-base text-gray-600 mb-8 leading-relaxed">
              Join our Discord community to find roommates, ask questions, and get housing advice from other UCR students.
            </p>
            <a 
              href="https://discord.gg/gqCQDXz4rg" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#1e3a5f] hover:bg-[#234b7a] text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 min-h-[44px] w-full sm:w-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord Community
            </a>
            <p className="text-sm text-gray-500 mt-8">
              In partnership with <span className="font-medium text-gray-600">HighlanderHousing</span>
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="bg-gray-100 border-t border-gray-200 py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 text-center sm:text-left">
            <svg 
              className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0 hidden sm:block" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-sm text-gray-500 leading-relaxed">
              DormDuos is an independent platform created by UCR students to help with off-campus housing searches. 
              Listings are posted by individuals and are not verified by this platform. 
              Always verify property details and landlord credentials before making any commitments.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home