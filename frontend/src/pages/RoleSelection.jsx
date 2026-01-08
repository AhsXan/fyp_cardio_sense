import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'

function RoleSelection() {
  const { logout, isAuthenticated } = useAuth()

  // Auto-logout if user is already authenticated and visits signup page
  useEffect(() => {
    if (isAuthenticated) {
      logout()
    }
  }, [])
  const roles = [
    {
      id: 'patient',
      title: 'Patient',
      description: 'Upload your heart sound recordings and get AI-powered analysis and reports.',
      icon: '👤',
      link: '/signup/patient',
    },
    {
      id: 'doctor',
      title: 'Doctor',
      description: 'Access patient records, review analyses, and provide medical insights.',
      icon: '👨‍⚕️',
      link: '/signup/doctor',
    },
    {
      id: 'researcher',
      title: 'Researcher',
      description: 'Request access to anonymized datasets for research purposes.',
      icon: '🔬',
      link: '/signup/researcher',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isPublic />
      
      <div className="flex-grow bg-gradient-to-br from-primary-light to-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Get Started Now</h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Choose your role to create an account and start using Cardio-Sense
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {roles.map((role) => (
              <Link
                key={role.id}
                to={role.link}
                className="card hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">{role.icon}</div>
                <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 sm:mb-3">{role.title}</h2>
                <p className="text-gray-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">{role.description}</p>
                <Button variant="primary" className="w-full">
                  Sign Up as {role.title}
                </Button>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Already have an account?</p>
            <Link to="/login" className="text-primary hover:text-primary-dark font-medium text-sm sm:text-base">
              Log in instead
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default RoleSelection

