import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../contexts/AuthContext'
import { researcherAPI } from '../../services/api'

function ResearcherDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedDatasets: 0,
    totalSuggestions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await researcherAPI.getMyAccess()
      const access = response.data.access || []
      setStats({
        pendingRequests: access.filter(a => a.status === 'pending').length,
        approvedDatasets: access.filter(a => a.status === 'approved').length,
        totalSuggestions: 0 // Will be updated when we add suggestions
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Request Data Set',
      description: 'Request access to anonymized datasets for research',
      icon: '📊',
      color: 'bg-blue-500',
      link: '/researcher/request-dataset'
    },
    {
      title: 'View Results',
      description: 'View analysis results and suggest improvements',
      icon: '🔬',
      color: 'bg-green-500',
      link: '/researcher/view-results'
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Researcher Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Welcome back, {user?.full_name || 'Researcher'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card text-center p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pendingRequests}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Pending Requests</div>
          </div>
          <div className="card text-center p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.approvedDatasets}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Approved Datasets</div>
          </div>
          <div className="card text-center p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalSuggestions}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Suggestions Made</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className={`${action.color} w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4`}>
                {action.icon}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{action.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ResearcherDashboard

