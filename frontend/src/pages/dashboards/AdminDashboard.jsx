import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'

function AdminDashboard() {
  const { user } = useAuth()

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage all registered users',
      icon: '👥',
      link: '#',
      color: 'bg-blue-500',
    },
    {
      title: 'System Statistics',
      description: 'View system usage and performance metrics',
      icon: '📊',
      link: '#',
      color: 'bg-green-500',
    },
    {
      title: 'Approve Requests',
      description: 'Review and approve pending verification requests',
      icon: '✅',
      link: '#',
      color: 'bg-purple-500',
    },
  ]

  // Mock data
  const pendingVerifications = [
    { id: 1, name: 'Dr. John Smith', email: 'john.smith@example.com', role: 'doctor', requestDate: '2025-01-15' },
    { id: 2, name: 'Dr. Jane Wilson', email: 'jane.wilson@example.com', role: 'doctor', requestDate: '2025-01-14' },
    { id: 3, name: 'Research Lab XYZ', email: 'contact@labxyz.edu', role: 'researcher', requestDate: '2025-01-13' },
  ]

  const systemStats = {
    totalUsers: 124,
    activeDoctors: 18,
    activeResearchers: 7,
    totalUploads: 89,
    pendingVerifications: 3,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Welcome back, {user?.full_name || 'Administrator'}!</p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">{systemStats.totalUsers}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Users</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{systemStats.activeDoctors}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Active Doctors</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{systemStats.activeResearchers}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Researchers</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{systemStats.totalUploads}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Uploads</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{systemStats.pendingVerifications}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Pending</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Pending Verifications */}
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Pending Verifications</h2>
            {pendingVerifications.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {pendingVerifications.map((verification) => (
                  <div key={verification.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                      <div className="mb-2 sm:mb-0">
                        <h3 className="font-semibold text-sm sm:text-base">{verification.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{verification.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Role: {verification.role}</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full self-start">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Requested: {verification.requestDate}</p>
                    <div className="flex flex-wrap gap-2">
                      <button className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors">
                        Approve
                      </button>
                      <button className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">
                        Reject
                      </button>
                      <button className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No pending verifications</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-1">
                <p className="text-sm font-medium">New user registration</p>
                <p className="text-xs text-gray-600">Dr. Michael Chen registered as a doctor</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
              <div className="border-l-4 border-green-500 pl-3 sm:pl-4 py-1">
                <p className="text-sm font-medium">Upload completed</p>
                <p className="text-xs text-gray-600">Patient recording analyzed successfully</p>
                <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-3 sm:pl-4 py-1">
                <p className="text-sm font-medium">Verification approved</p>
                <p className="text-xs text-gray-600">Dr. Sarah Johnson's credentials verified</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-3 sm:pl-4 py-1">
                <p className="text-sm font-medium">New dataset request</p>
                <p className="text-xs text-gray-600">Researcher requested access to dataset #12</p>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard