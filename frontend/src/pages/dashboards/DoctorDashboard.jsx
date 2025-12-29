import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'

function DoctorDashboard() {
  const { user } = useAuth()

  const quickActions = [
    {
      title: 'View Predicted Results',
      description: 'View AI-predicted results and approve or reject them',
      icon: '🔍',
      link: '#',
      color: 'bg-blue-500',
    },
    {
      title: 'Generate Prescription',
      description: 'Create prescriptions based on analysis results',
      icon: '📝',
      link: '#',
      color: 'bg-green-500',
    },
    {
      title: 'View Recorded PCG',
      description: 'View patient phonocardiogram recordings',
      icon: '🎧',
      link: '#',
      color: 'bg-purple-500',
    },
  ]

  // Mock data
  const pendingApprovals = [
    { id: 1, patientName: 'Ahsan Ahmed', uploadDate: '2025-01-15', status: 'pending' },
    { id: 2, patientName: 'John Doe', uploadDate: '2025-01-14', status: 'pending' },
  ]

  const recentPatientUploads = [
    { id: 1, patientName: 'Ahsan Ahmed', filename: 'recording_001.wav', date: '2025-01-15' },
    { id: 2, patientName: 'Jane Smith', filename: 'recording_002.wav', date: '2025-01-14' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Welcome back, Dr. {user?.full_name || 'Doctor'}!</p>
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
          {/* Predicted Results - Approve/Reject */}
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Predicted Results - Pending Review</h2>
            {pendingApprovals.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                      <div className="mb-2 sm:mb-0">
                        <h3 className="font-semibold text-sm sm:text-base">{approval.patientName}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Uploaded: {approval.uploadDate}</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full self-start">
                        {approval.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link to={`/results/${approval.id}`}>
                        <Button variant="primary" className="text-xs sm:text-sm px-3 sm:px-4 py-1">
                          View Results
                        </Button>
                      </Link>
                      <Button variant="secondary" className="text-xs sm:text-sm px-3 sm:px-4 py-1 bg-green-600 hover:bg-green-700 text-white">
                        Approve
                      </Button>
                      <Button variant="secondary" className="text-xs sm:text-sm px-3 sm:px-4 py-1 bg-red-600 hover:bg-red-700 text-white">
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No pending results to review</p>
            )}
          </div>

          {/* View Recorded PCG */}
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Recorded PCG Files</h2>
            {recentPatientUploads.length > 0 ? (
              <div className="space-y-3">
                {recentPatientUploads.map((upload) => (
                  <div key={upload.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base">{upload.patientName}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{upload.filename}</p>
                    <p className="text-xs text-gray-500 mt-1">Date: {upload.date}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link
                        to={`/results/${upload.id}`}
                        className="text-primary hover:text-primary-dark text-xs sm:text-sm"
                      >
                        View PCG →
                      </Link>
                      <Button variant="primary" className="text-xs sm:text-sm px-3 sm:px-4 py-1">
                        Generate Prescription
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recorded PCG files</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard

