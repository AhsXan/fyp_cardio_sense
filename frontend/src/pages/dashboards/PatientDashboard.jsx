import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { pcgAPI } from '../../services/api'

function PatientDashboard() {
  const { user } = useAuth()
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    normal: 0,
    abnormal: 0,
    pending: 0
  })

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const response = await pcgAPI.getUploads()
      const uploadList = response.data.uploads || []
      setUploads(uploadList)
      
      // Calculate stats
      const newStats = {
        total: uploadList.length,
        normal: uploadList.filter(u => u.classification === 'NORMAL').length,
        abnormal: uploadList.filter(u => u.classification === 'ABNORMAL').length,
        pending: uploadList.filter(u => !u.classification || u.classification === 'PENDING').length
      }
      setStats(newStats)
    } catch (err) {
      console.error('Failed to fetch uploads:', err)
      setError('Failed to load your uploads')
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Upload PCG Recording',
      description: 'Upload a new heart sound recording for AI analysis',
      icon: '📤',
      link: '/upload',
      color: 'bg-blue-500',
    },
  ]

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Helper for classification badge
  const getClassificationBadge = (classification, confidence) => {
    if (!classification || classification === 'PENDING') {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Pending
        </span>
      )
    }
    
    const isNormal = classification === 'NORMAL'
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        isNormal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {classification} {confidence ? `(${confidence.toFixed(0)}%)` : ''}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Welcome back, {user?.full_name || 'Patient'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Uploads</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.normal}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Normal</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.abnormal}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Abnormal</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-gray-600">{stats.pending}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Pending</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className={`${action.color} w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4`}>
                {action.icon}
              </div>
              <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">{action.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
        </div>

        {/* Analysis History */}
        <div className="card mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Analysis History</h2>
            <button onClick={fetchUploads} className="text-primary text-sm hover:underline">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📁</div>
              <p>No uploads yet. Upload your first heart sound recording!</p>
              <Link to="/upload">
                <Button variant="primary" className="mt-4">
                  Upload Now
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {uploads.slice(0, 5).map((upload) => (
                  <div key={upload.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{upload.filename}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(upload.created_at)}</p>
                      </div>
                      {getClassificationBadge(upload.classification, upload.confidence)}
                    </div>
                    <div className="mt-3">
                      {upload.status === 'completed' ? (
                        <Link
                          to={`/results/${upload.id}`}
                          className="text-primary hover:text-primary-dark text-sm font-medium"
                        >
                          View Results →
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">Processing...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AI Result
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploads.slice(0, 10).map((upload) => (
                      <tr key={upload.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {upload.filename}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(upload.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getClassificationBadge(upload.classification, upload.confidence)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {upload.status === 'completed' ? (
                            <Link
                              to={`/results/${upload.id}`}
                              className="text-primary hover:text-primary-dark"
                            >
                              View Results
                            </Link>
                          ) : (
                            <span className="text-gray-400">Processing...</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>


      </div>
    </div>
  )
}

export default PatientDashboard

