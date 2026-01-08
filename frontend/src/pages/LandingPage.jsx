import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'

function LandingPage() {
  const { logout, isAuthenticated } = useAuth()

  // Auto-logout if user is already authenticated and visits landing page
  useEffect(() => {
    if (isAuthenticated) {
      logout()
    }
  }, [])
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isPublic />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-dark via-primary-dark to-primary py-12 sm:py-16 md:py-20 lg:py-28 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Prioritizing Your Cardiac Health with Precision
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-100 leading-relaxed max-w-xl mx-auto md:mx-0">
                Leverage advanced AI-powered diagnostics to detect early signs of heart disease. 
                Reliable, accurate, and accessible – anytime, anywhere.
              </p>
              <Link to="/select-role" className="inline-block">
                <Button variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  Get Started Now
                </Button>
              </Link>
            </div>
            <div className="flex justify-center items-center mt-8 md:mt-0">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl blur-2xl"></div>
                <div className="relative rounded-3xl overflow-hidden p-4 sm:p-6 bg-white/5 backdrop-blur-md border border-white/10">
                  <img 
                    src="/website-logo.png" 
                    alt="Cardio-Sense Heart Icon" 
                    className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 drop-shadow-2xl rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 bg-[#3699F7] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 shadow-lg">
            <span className="text-white font-semibold text-base sm:text-lg">Instant Report</span>
            <div className="hidden sm:block h-8 w-px bg-white/50"></div>
            <span className="text-white font-semibold text-base sm:text-lg">AI-Powered</span>
          </div>
        </div>
      </section>

      {/* Diagnostic Capabilities */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">Our Diagnostic Capabilities</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Comprehensive cardiac health analysis powered by advanced AI technology
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                title: 'Heart Sound Analysis',
                description: 'Uses AI to analyze S1 & S2 heart sounds for abnormal patterns.',
                icon: '🎧',
                iconBg: 'bg-primary-light',
                highlighted: false,
              },
              {
                title: 'Early Risk Detection',
                description: 'Detect potential heart issues before symptoms appear.',
                icon: '❤️',
                iconBg: 'bg-red-100',
                highlighted: true,
              },
              {
                title: 'Health Summary Report',
                description: 'Receive a comprehensive diagnosis summary.',
                icon: '📊',
                iconBg: 'bg-primary-light',
                highlighted: false,
              },
              {
                title: 'Data Privacy & Protection',
                description: 'Protection and Privacy in Compliance with PIC and PMC.',
                icon: '🔒',
                iconBg: 'bg-primary-light',
                highlighted: false,
              },
            ].map((capability, index) => (
              <div 
                key={index} 
                className={`${capability.highlighted 
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl sm:scale-105' 
                  : 'bg-white border border-gray-100'} 
                  rounded-2xl p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group`}
              >
                <div className={`${capability.highlighted ? 'bg-white/20' : capability.iconBg} w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-3xl sm:text-4xl">{capability.icon}</div>
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 sm:mb-3 ${capability.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {capability.title}
                </h3>
                <p className={capability.highlighted ? 'text-white/90 leading-relaxed text-sm sm:text-base' : 'text-gray-600 leading-relaxed text-sm sm:text-base'}>
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800" 
                  alt="Digital healthcare and telemedicine platform with medical data visualization" 
                  className="w-full h-auto object-cover min-h-[250px] sm:min-h-[300px] bg-gray-200"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-4 sm:space-y-6">
              <div>
                <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">Why Choose Us</span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4 sm:mb-6">Why You Choose Us?</h2>
              </div>
              <ul className="space-y-4 sm:space-y-5">
                {['AI-Powered Accuracy', 'User-Friendly Interface', 'Instant Results', 'Trusted & Secure'].map((feature, index) => (
                  <li key={index} className="flex items-start group">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 group-hover:bg-green-500 transition-colors duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-base sm:text-lg text-gray-700 font-medium pt-1">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/select-role" className="inline-flex items-center mt-6 sm:mt-8 text-primary hover:text-primary-dark font-semibold group">
                <span>Learn More</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              What Our <span className="text-primary">Member's</span> Saying About Us
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">Trusted by healthcare professionals worldwide</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl border border-gray-100">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
                  <span className="text-white font-bold text-sm sm:text-lg">MA</span>
                </div>
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-gray-900">Dr Muhammad Ashfaq</h4>
                  <p className="text-xs sm:text-sm text-gray-500">Cardiologist • 5/6/25</p>
                </div>
              </div>
              <div className="flex mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed italic">
                "CardioSense is a remarkable step forward in preventive heart care. Its AI-based diagnosis 
                offers patients timely insights that can truly save lives."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Future of Health */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-wider">Our Vision</span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4 sm:mb-6">
                  The Future of <span className="text-primary">Quality Health</span>
                </h2>
              </div>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                We envision a future where intelligent, accessible, and personalized care is available 
                to everyone. Through AI and modern diagnostics, we're making this vision a reality.
              </p>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                Our platform combines cutting-edge technology with user-friendly design, ensuring that 
                advanced cardiac diagnostics are within reach for patients, doctors, and researchers alike.
              </p>
              <Link to="/select-role" className="inline-flex items-center mt-6 sm:mt-8 text-primary hover:text-primary-dark font-semibold group">
                <span>Learn More</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800" 
                  alt="Doctor with clipboard attending to patient in hospital bed" 
                  className="w-full h-auto object-cover min-h-[250px] sm:min-h-[300px] bg-gray-200"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default LandingPage
