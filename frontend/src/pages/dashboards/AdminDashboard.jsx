import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../services/api'

function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // AI Testing states
  const [showAITest, setShowAITest] = useState(false)
  const [aiFile, setAiFile] = useState(null)
  const [aiTesting, setAiTesting] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsResponse, pendingResponse] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPendingApprovals()
      ])
      setStats(statsResponse.data)
      setPendingVerifications(pendingResponse.data.approvals || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this user?')) return
    
    try {
      await adminAPI.approveUser(userId)
      alert('User approved successfully!')
      fetchDashboardData() // Refresh data
    } catch (err) {
      alert('Failed to approve user: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleReject = async (userId) => {
    const reason = window.prompt('Enter rejection reason (optional):')
    if (reason === null) return // User cancelled
    
    try {
      await adminAPI.rejectUser(userId, reason)
      alert('User rejected successfully!')
      fetchDashboardData() // Refresh data
    } catch (err) {
      alert('Failed to reject user: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleViewDetails = (verification) => {
    setSelectedUser(verification)
    setShowDetailsModal(true)
  }

  const closeModal = () => {
    setShowDetailsModal(false)
    setSelectedUser(null)
  }

  const handleAIFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.wav')) {
        setAiError('Please select a WAV audio file')
        return
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setAiError('File size must be less than 10MB')
        return
      }
      setAiFile(file)
      setAiError(null)
      setAiResult(null)
    }
  }

  const handleTestAI = async () => {
    if (!aiFile) {
      setAiError('Please select an audio file first')
      return
    }

    setAiTesting(true)
    setAiError(null)
    
    try {
      const formData = new FormData()
      formData.append('audio_file', aiFile)
      
      const response = await adminAPI.testAIPrediction(formData)
      setAiResult(response.data)
      console.log('AI Prediction Result:', response.data)
    } catch (err) {
      console.error('AI Test Error:', err)
      setAiError(err.response?.data?.detail || 'Failed to test AI model')
    } finally {
      setAiTesting(false)
    }
  }

  const resetAITest = () => {
    setAiFile(null)
    setAiResult(null)
    setAiError(null)
  }

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage all registered users',
      icon: '👥',
      link: '/admin/manage-users',
      color: 'bg-blue-500',
    },
    {
      title: 'System Statistics',
      description: 'Activity logs and system performance metrics',
      icon: '📊',
      link: '/admin/system-stats',
      color: 'bg-green-500',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
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
            <p className="text-2xl sm:text-3xl font-bold text-primary">{stats?.total_users || 0}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Users</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats?.total_doctors || 0}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Doctors</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats?.total_researchers || 0}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Researchers</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats?.total_uploads || 0}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Uploads</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats?.pending_verifications || 0}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Pending</p>
          </div>
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

        {/* AI Model Testing Section */}
        <div className="card mb-6 sm:mb-8 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-purple-900 flex items-center gap-2">
                🤖 AI Model Testing
              </h2>
              <p className="text-sm text-purple-700 mt-1">Test heart sound classification before full integration</p>
            </div>
            <button
              onClick={() => setShowAITest(!showAITest)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {showAITest ? 'Hide' : 'Show'} Test Panel
            </button>
          </div>

          {showAITest && (
            <div className="mt-4 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Heart Sound (WAV file)
                </label>
                <input
                  type="file"
                  accept=".wav"
                  onChange={handleAIFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
                {aiFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: <span className="font-medium">{aiFile.name}</span> ({(aiFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {/* Test Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleTestAI}
                  disabled={!aiFile || aiTesting}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {aiTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      🔬 Test AI Model
                    </>
                  )}
                </button>
                {(aiFile || aiResult) && (
                  <button
                    onClick={resetAITest}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Error Display */}
              {aiError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  ❌ {aiError}
                </div>
              )}

              {/* Result Display */}
              {aiResult && (
                <div className="p-6 bg-white border-2 border-purple-300 rounded-lg shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    🎯 Prediction Results
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Classification</p>
                      <p className={`text-2xl font-bold ${
                        aiResult.prediction.label === 'NORMAL' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {aiResult.prediction.label}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Confidence</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {aiResult.prediction.confidence}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Probabilities:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Normal:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {aiResult.prediction.probabilities.normal}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Abnormal:</span>
                        <span className="text-sm font-semibold text-red-600">
                          {aiResult.prediction.probabilities.abnormal}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>File: {aiResult.filename}</p>
                    <p>Timestamp: {new Date(aiResult.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending Verifications - Full Width */}
        <div className="card mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Pending Verifications</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            {pendingVerifications.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {pendingVerifications.map((verification) => (
                  <div key={verification.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                      <div className="mb-2 sm:mb-0">
                        <h3 className="font-semibold text-sm sm:text-base">{verification.full_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{verification.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Role: {verification.role}</p>
                        {verification.license_number && (
                          <p className="text-xs text-gray-500">License: {verification.license_number}</p>
                        )}
                        {verification.institution && (
                          <p className="text-xs text-gray-500">Institution: {verification.institution}</p>
                        )}
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full self-start">
                        {verification.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Requested: {verification.created_at ? new Date(verification.created_at).toLocaleDateString() : 'N/A'}</p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleViewDetails(verification)}
                        className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleApprove(verification.id)}
                        className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(verification.id)}
                        className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No pending verifications</p>
            )}
          </div>

        {/* User Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Full Name</p>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Role</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Status</p>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedUser.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedUser.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Requested Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Professional Information (Doctor/Researcher) */}
                {(selectedUser.role === 'doctor' || selectedUser.role === 'researcher') && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedUser.license_number && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase">License Number</p>
                          <p className="text-sm font-medium text-gray-900">{selectedUser.license_number}</p>
                        </div>
                      )}
                      {selectedUser.institution && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Institution</p>
                          <p className="text-sm font-medium text-gray-900">{selectedUser.institution}</p>
                        </div>
                      )}
                      {selectedUser.specialization && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Specialization</p>
                          <p className="text-sm font-medium text-gray-900">{selectedUser.specialization}</p>
                        </div>
                      )}
                      {selectedUser.research_area && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Research Area</p>
                          <p className="text-sm font-medium text-gray-900">{selectedUser.research_area}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {(selectedUser.license_document_path || selectedUser.affiliation_document_path) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Documents</h3>
                    <div className="space-y-3">
                      {selectedUser.license_document_path && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">License Document</p>
                              <p className="text-xs text-gray-500">{selectedUser.license_document_path.split('/').pop()}</p>
                            </div>
                            <a
                              href={`http://localhost:8000${selectedUser.license_document_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Open →
                            </a>
                          </div>
                          {/* Image Preview */}
                          {(selectedUser.license_document_path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                            <div className="mt-2">
                              <img
                                src={`http://localhost:8000${selectedUser.license_document_path}`}
                                alt="License Document"
                                className="w-full max-h-64 object-contain border border-gray-200 rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'block'
                                }}
                              />
                              <div className="hidden text-sm text-gray-500 text-center py-4">
                                Image preview unavailable
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {selectedUser.affiliation_document_path && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900">Affiliation Document</p>
                              <p className="text-xs text-gray-500">{selectedUser.affiliation_document_path.split('/').pop()}</p>
                            </div>
                            <a
                              href={`http://localhost:8000${selectedUser.affiliation_document_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Open →
                            </a>
                          </div>
                          {/* Image Preview */}
                          {(selectedUser.affiliation_document_path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                            <div className="mt-2">
                              <img
                                src={`http://localhost:8000${selectedUser.affiliation_document_path}`}
                                alt="Affiliation Document"
                                className="w-full max-h-64 object-contain border border-gray-200 rounded"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'block'
                                }}
                              />
                              <div className="hidden text-sm text-gray-500 text-center py-4">
                                Image preview unavailable
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      closeModal()
                      handleApprove(selectedUser.id)
                    }}
                    className="flex-1 sm:flex-none px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Approve User
                  </button>
                  <button
                    onClick={() => {
                      closeModal()
                      handleReject(selectedUser.id)
                    }}
                    className="flex-1 sm:flex-none px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Reject User
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 sm:flex-none px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard