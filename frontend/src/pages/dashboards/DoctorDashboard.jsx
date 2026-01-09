import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { doctorAPI } from '../../services/api'

function DoctorDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    stats: { total_patients: 0, total_uploads: 0, pending_review: 0, normal_count: 0, abnormal_count: 0 },
    pending_reviews: [],
    recent_uploads: []
  })
  const [reviewingId, setReviewingId] = useState(null)
  const [reviewModal, setReviewModal] = useState({ open: false, upload: null })

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await doctorAPI.getDashboard()
      setDashboardData(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Classification badge component
  const ClassificationBadge = ({ classification, confidence }) => {
    if (!classification) return <span className="text-gray-400 text-xs">Pending</span>
    
    const isNormal = classification === 'NORMAL'
    return (
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
          isNormal 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {isNormal ? '❤️' : '⚠️'} {classification}
        </span>
        {confidence && (
          <span className="text-xs text-gray-500">{confidence.toFixed(1)}%</span>
        )}
      </div>
    )
  }

  // Handle review submission
  const handleReview = async (uploadId, agreesWithAi, override = null) => {
    try {
      setReviewingId(uploadId)
      await doctorAPI.reviewAnalysis(uploadId, {
        agrees_with_ai: agreesWithAi,
        classification_override: override
      })
      await fetchDashboard() // Refresh data
      setReviewModal({ open: false, upload: null })
    } catch (err) {
      console.error('Review failed:', err)
      alert('Failed to submit review')
    } finally {
      setReviewingId(null)
    }
  }

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Welcome back, Dr. {user?.full_name || 'Doctor'}!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="card text-center p-4">
            <div className="text-2xl sm:text-3xl font-bold text-primary">{dashboardData.stats.total_patients}</div>
            <div className="text-xs sm:text-sm text-gray-600">Patients</div>
          </div>
          <div className="card text-center p-4">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{dashboardData.stats.total_uploads}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Uploads</div>
          </div>
          <div className="card text-center p-4">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{dashboardData.stats.pending_review}</div>
            <div className="text-xs sm:text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="card text-center p-4">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{dashboardData.stats.normal_count}</div>
            <div className="text-xs sm:text-sm text-gray-600">Normal</div>
          </div>
          <div className="card text-center p-4">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{dashboardData.stats.abnormal_count}</div>
            <div className="text-xs sm:text-sm text-gray-600">Abnormal</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Pending AI Reviews */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">🔬 AI Predictions - Needs Review</h2>
              {dashboardData.pending_reviews.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  {dashboardData.pending_reviews.length} pending
                </span>
              )}
            </div>
            
            {dashboardData.pending_reviews.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                {dashboardData.pending_reviews.map((item) => (
                  <div key={item.id} className={`border rounded-lg p-3 sm:p-4 ${
                    item.classification === 'ABNORMAL' 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                      <div className="mb-2 sm:mb-0">
                        <h3 className="font-semibold text-sm sm:text-base">{item.patient_name}</h3>
                        <p className="text-xs text-gray-500">{item.filename}</p>
                        <p className="text-xs text-gray-400">Uploaded: {formatDate(item.upload_date)}</p>
                      </div>
                      <ClassificationBadge 
                        classification={item.classification} 
                        confidence={item.confidence} 
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link to={`/results/${item.id}`}>
                        <Button variant="secondary" className="text-xs px-3 py-1">
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        variant="success" 
                        className="text-xs px-3 py-1"
                        onClick={() => handleReview(item.id, true)}
                        disabled={reviewingId === item.id}
                      >
                        {reviewingId === item.id ? 'Saving...' : '✓ Agree with AI'}
                      </Button>
                      <Button 
                        variant="warning" 
                        className="text-xs px-3 py-1"
                        onClick={() => setReviewModal({ open: true, upload: item })}
                      >
                        ✎ Override
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p>All AI predictions have been reviewed!</p>
              </div>
            )}
          </div>

          {/* Recent Uploads */}
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">📁 Recent Patient Uploads</h2>
            {dashboardData.recent_uploads.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.recent_uploads.map((upload) => (
                  <div key={upload.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">{upload.patient_name}</h3>
                        <p className="text-xs text-gray-600">{upload.filename}</p>
                        <p className="text-xs text-gray-400">{formatDate(upload.upload_date)}</p>
                      </div>
                      <div className="text-right">
                        <ClassificationBadge 
                          classification={upload.classification} 
                          confidence={upload.confidence} 
                        />
                        {upload.doctor_reviewed && (
                          <p className="text-xs text-green-600 mt-1">✓ Reviewed</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Link to={`/results/${upload.id}`} className="text-primary hover:text-primary-dark text-xs sm:text-sm">
                        View Results →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📂</div>
                <p>No uploads from patients yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Override Modal */}
      {reviewModal.open && reviewModal.upload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Override AI Classification</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Patient: <strong>{reviewModal.upload.patient_name}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                AI Result: <ClassificationBadge 
                  classification={reviewModal.upload.classification} 
                  confidence={reviewModal.upload.confidence} 
                />
              </p>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Select your classification:
            </p>
            <div className="flex flex-col gap-3">
              <Button
                variant="success"
                className="w-full"
                onClick={() => handleReview(reviewModal.upload.id, false, 'NORMAL')}
                disabled={reviewingId === reviewModal.upload.id}
              >
                ❤️ Mark as NORMAL
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => handleReview(reviewModal.upload.id, false, 'ABNORMAL')}
                disabled={reviewingId === reviewModal.upload.id}
              >
                ⚠️ Mark as ABNORMAL
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setReviewModal({ open: false, upload: null })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorDashboard

