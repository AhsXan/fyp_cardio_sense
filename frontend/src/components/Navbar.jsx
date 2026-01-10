/**
 * Navigation Bar Component
 * - Shows different links for public vs authenticated users
 * - Mobile-responsive with hamburger menu
 * - Role-based navigation (patient/doctor/researcher/admin)
 * - Smooth scrolling to page sections
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Navbar({ isPublic = false }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // Mobile menu state

  // Handle logout and redirect to home
  const handleLogout = () => {
    logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  // Close mobile menu (used after navigation)
  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  // Smooth scroll to section (for landing page)
  const scrollToSection = (e, sectionId) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    
    // If already on landing page, scroll directly
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } })
    }
  }

  return (
    <nav className="bg-white shadow-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/website-logo.png" alt="Cardio-Sense" className="h-8 w-8" />
              <span className="text-lg sm:text-xl font-bold text-primary">Cardio-Sense</span>
            </Link>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* Public navigation (not logged in) */}
            {isPublic && !isAuthenticated ? (
              <>
                <Link to="/" className="text-gray-700 hover:text-primary px-3 py-2 text-sm lg:text-base transition-colors">Home</Link>
                <button onClick={(e) => scrollToSection(e, 'footer')} className="text-gray-700 hover:text-primary px-3 py-2 text-sm lg:text-base transition-colors">About</button>
                <button onClick={(e) => scrollToSection(e, 'capabilities')} className="text-gray-700 hover:text-primary px-3 py-2 text-sm lg:text-base transition-colors">Services</button>
                <Link to="/login" className="text-primary hover:text-primary-dark px-3 py-2 text-sm lg:text-base transition-colors">Log in</Link>
                <Link to="/select-role" className="btn-primary text-sm lg:text-base">Sign up</Link>
              </>
            ) : isAuthenticated ? (
              /* Authenticated navigation */
              <>
                <Link to={`/dashboard/${user?.role}`} className="text-gray-700 hover:text-primary px-3 py-2 text-sm lg:text-base transition-colors">
                  Dashboard
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-primary px-3 py-2 text-sm lg:text-base transition-colors">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-primary px-3 py-2 text-sm lg:text-base transition-colors"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Toggle Button (hamburger) */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {/* Toggle between X and hamburger icon */}
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isPublic && !isAuthenticated ? (
              <>
                <Link to="/" onClick={closeMobileMenu} className="block text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors">
                  Home
                </Link>
                <button onClick={(e) => scrollToSection(e, 'footer')} className="block w-full text-left text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors">
                  About
                </button>
                <button onClick={(e) => scrollToSection(e, 'capabilities')} className="block w-full text-left text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors">
                  Services
                </button>
                <Link to="/login" onClick={closeMobileMenu} className="block text-primary hover:text-primary-dark hover:bg-primary-light px-3 py-3 rounded-md text-base font-medium transition-colors">
                  Log in
                </Link>
                <Link to="/select-role" onClick={closeMobileMenu} className="block btn-primary w-full text-center mt-2">
                  Sign up
                </Link>
              </>
            ) : isAuthenticated ? (
              <>
                <Link to={`/dashboard/${user?.role}`} onClick={closeMobileMenu} className="block text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/profile" onClick={closeMobileMenu} className="block text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-gray-700 hover:text-primary hover:bg-gray-50 px-3 py-3 rounded-md text-base font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar

