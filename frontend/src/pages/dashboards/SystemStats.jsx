import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { adminAPI } from '../../services/api'

function SystemStats() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchSystemData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      const [statsResponse, activityResponse] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRecentActivity()
      ])
      setStats(statsResponse.data)
      setActivities(activityResponse.data.activities || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching system data:', err)
      setError('Failed to load system data')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    const icons = {
      user_signup: '👤',
      user_approved: '✅',
      user_rejected: '❌',
      user_login: '🔐',
      pcg_upload: '📤',
      pcg_analysis: '🔬'
    }
    return icons[type] || '📝'
  }

  const getActivityColor = (type) => {
    const colors = {
      user_signup: 'border-blue-500',
      user_approved: 'border-green-500',
      user_rejected: 'border-red-500',
      user_login: 'border-purple-500',
      pcg_upload: 'border-orange-500',
      pcg_analysis: 'border-teal-500'
    }
    return colors[type] || 'border-gray-500'
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return time.toLocaleDateString()
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading system statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="text-primary hover:text-primary-dark mb-2 text-sm flex items-center"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Statistics</h1>
            <p className="text-gray-600 mt-1">Activity logs and performance metrics</p>
          </div>
          <button
            onClick={fetchSystemData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-primary">{stats?.total_users || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Total Users</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.total_doctors || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Doctors</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-purple-600">{stats?.total_researchers || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Researchers</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">{stats?.total_uploads || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Uploads</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-orange-600">{stats?.pending_verifications || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Pending</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-teal-600">{stats?.uploads_today || 0}</p>
            <p className="text-xs text-gray-600 mt-1">Today</p>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>

          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div 
                  key={index} 
                  className={`border-l-4 ${getActivityColor(activity.type)} pl-4 py-2 bg-gray-50 rounded-r-lg`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      </div>
                      <p className="text-xs text-gray-600 ml-7">{activity.description}</p>
                      <p className="text-xs text-gray-500 ml-7 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SystemStats
