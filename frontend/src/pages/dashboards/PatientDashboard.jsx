import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'

function PatientDashboard() {
  const { user } = useAuth()

  const quickActions = [
    {
      title: 'Upload PCG Recordings',
      description: 'Upload a new heart sound recording for analysis',
      icon: '📤',
      link: '/upload',
      color: 'bg-blue-500',
    },
    {
      title: 'View Reports',
      description: 'View your analysis reports and download them',
      icon: '📊',
      link: '/dashboard/patient',
      color: 'bg-green-500',
    },
  ]

  // Mock data for recent uploads
  const recentUploads = [
    { id: 1, filename: 'recording_001.wav', date: '2025-01-15', status: 'completed' },
    { id: 2, filename: 'recording_002.wav', date: '2025-01-14', status: 'processing' },
    { id: 3, filename: 'recording_003.wav', date: '2025-01-13', status: 'completed' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Welcome back, {user?.full_name || 'Patient'}!</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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

        {/* Recent Uploads */}
        <div className="card mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Recent Uploads</h2>
          
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {recentUploads.map((upload) => (
              <div key={upload.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{upload.filename}</p>
                    <p className="text-xs text-gray-500 mt-1">{upload.date}</p>
                  </div>
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full flex-shrink-0 ${
                    upload.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {upload.status}
                  </span>
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
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUploads.map((upload) => (
                  <tr key={upload.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {upload.filename}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {upload.date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        upload.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {upload.status}
                      </span>
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
        </div>

        {/* Upload New Recording */}
        <div className="text-center">
          <Link to="/upload">
            <Button variant="primary" className="text-base sm:text-lg px-6 sm:px-8 py-3">
              Upload New Recording
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard

