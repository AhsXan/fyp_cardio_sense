/**
 * Results Page - Display AI analysis results for heart sound upload
 * - AI classification (NORMAL/ABNORMAL) with confidence
 * - Probability breakdown and processing details
 * - Doctor's review section (if reviewed)
 * - Researcher suggestions (if any)
 * - Waveform visualization
 * - PDF report download
 * - Doctor comment functionality (for doctors only)
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import { pcgAPI, doctorAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function ResultsPage() {
  const { uploadId } = useParams() // Get upload ID from URL
  const navigate = useNavigate()
  const { user } = useAuth()
  const [results, setResults] = useState(null) // AI analysis results
  const [loading, setLoading] = useState(true) // Page loading state
  const [error, setError] = useState('') // Error messages
  const [comments, setComments] = useState('') // Doctor comments
  const [savingComments, setSavingComments] = useState(false) // Save comments button state
  
  const isDoctor = user?.role === 'doctor' // Check if current user is a doctor

  // Fetch results on component mount
  useEffect(() => {
    fetchResults()
  }, [uploadId])

  // Fetch analysis results from backend
  const fetchResults = async () => {
    try {
      const response = await pcgAPI.getResults(uploadId)
      setResults(response.data)
      // Pre-fill comments if doctor already commented
      if (response.data.doctor_comments) {
        setComments(response.data.doctor_comments)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  // Save doctor's comments (doctors only)
  const handleSaveComments = async () => {
    if (!comments.trim()) {
      alert('Please enter a comment before saving.')
      return
    }
    
    try {
      setSavingComments(true)
      await doctorAPI.addComment(uploadId, comments)
      alert('Comments saved successfully!')
      fetchResults() // Refresh to show updated comments
    } catch (err) {
      console.error('Failed to save comments:', err)
      alert('Failed to save comments. Please try again.')
    } finally {
      setSavingComments(false)
    }
  }

  // Download PDF report
  const handleDownloadReport = async () => {
    try {
      const response = await pcgAPI.downloadReport(uploadId)
      // Create blob from binary data
      const blob = new Blob([response.data], { type: 'application/pdf' })
      // Create temporary download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `CardioSense_Report_${uploadId}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click() // Trigger download
      // Cleanup temporary elements
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to download PDF report. Please try again.')
    }
  }

  // Helper to get classification color
  const getClassificationColor = (classification) => {
    if (classification === 'NORMAL') return 'text-green-600'
    if (classification === 'ABNORMAL') return 'text-red-600'
    return 'text-gray-600'
  }

  const getClassificationBg = (classification) => {
    if (classification === 'NORMAL') return 'from-green-50 to-green-100 border-green-300'
    if (classification === 'ABNORMAL') return 'from-red-50 to-red-100 border-red-300'
    return 'from-gray-50 to-gray-100 border-gray-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading results...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="primary" onClick={() => navigate('/dashboard/patient')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </div>

        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analysis Results</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            {results?.filename || `Upload ID: ${uploadId}`}
          </p>
        </div>

        {/* ============== AI CLASSIFICATION RESULT ============== */}
        {results?.classification && (
          <div className={`card mb-6 bg-gradient-to-br ${getClassificationBg(results.classification)} border-2`}>
            <div className="text-center py-6">
              <div className="text-6xl mb-4">
                {results.classification === 'NORMAL' ? '❤️' : '⚠️'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className={getClassificationColor(results.classification)}>
                  {results.classification}
                </span>
              </h2>
              <p className="text-lg text-gray-700 mb-4">Heart Sound Classification</p>
              
              {/* Confidence Score */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Confidence</span>
                  <span className="font-bold">{results.classification_confidence?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-500 ${
                      results.classification === 'NORMAL' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${results.classification_confidence || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Probability Breakdown */}
              <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Normal</p>
                  <p className="text-2xl font-bold text-green-600">
                    {results.probability_normal?.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Abnormal</p>
                  <p className="text-2xl font-bold text-red-600">
                    {results.probability_abnormal?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Info */}
        {results?.processing_time_seconds && (
          <div className="card mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Model Version</p>
                <p className="font-semibold">{results.model_version || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Processing Time</p>
                <p className="font-semibold">{results.processing_time_seconds?.toFixed(2)}s</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Analyzed At</p>
                <p className="font-semibold">
                  {results.created_at ? new Date(results.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Device</p>
                <p className="font-semibold">{results.device || 'Not specified'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Doctor's Review Section */}
        {results?.doctor_reviewed && (
          <div className="card mb-6 border-2 border-blue-200 bg-blue-50">
            <h3 className="text-lg font-semibold mb-3 text-blue-900">
              🩺 Doctor's Review
            </h3>
            <div className="space-y-2">
              {results.doctor_agrees_with_ai !== null && (
                <p>
                  <span className="text-gray-600">Doctor's Assessment: </span>
                  <span className={`font-semibold ${
                    results.doctor_agrees_with_ai ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {results.doctor_agrees_with_ai ? 'Agrees with AI' : 'Disagrees with AI'}
                  </span>
                </p>
              )}
              {results.doctor_classification && (
                <p>
                  <span className="text-gray-600">Doctor's Classification: </span>
                  <span className={`font-bold ${getClassificationColor(results.doctor_classification)}`}>
                    {results.doctor_classification}
                  </span>
                </p>
              )}
              {results.doctor_comments && (
                <div className="mt-3 p-3 bg-white rounded-lg">
                  <p className="text-gray-700">{results.doctor_comments}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Researcher Suggestions Section */}
        {results?.researcher_suggestions && results.researcher_suggestions.length > 0 && (
          <div className="card mb-6 border-2 border-purple-200 bg-purple-50">
            <h3 className="text-lg font-semibold mb-3 text-purple-900">
              🔬 Researcher Suggestions
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Research feedback and suggestions for improving AI model accuracy
            </p>
            <div className="space-y-3">
              {results.researcher_suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-purple-100">
                  <p className="text-gray-700 mb-2">{suggestion.suggestion}</p>
                  <p className="text-xs text-gray-500">
                    Submitted: {new Date(suggestion.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waveform Visualization */}
        <div className="card mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Waveform Visualization</h2>
          <div className="bg-gray-100 rounded-lg p-4 sm:p-6 md:p-8 flex items-center justify-center min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
            {results?.visualization_url ? (
              <img
                src={results.visualization_url}
                alt="ECG Waveform"
                className="max-w-full h-auto"
              />
            ) : (
              <div className="text-center text-gray-500">
                <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm sm:text-base">Waveform visualization coming soon</p>
              </div>
            )}
          </div>
        </div>

        {/* Download Report */}
        <div className="card mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Download Report</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Download a comprehensive PDF report of the analysis</p>
            </div>
            <Button variant="primary" onClick={handleDownloadReport} className="w-full sm:w-auto">
              Download PDF Report
            </Button>
          </div>
        </div>

        {/* Doctor Comments Section - Only for Doctors */}
        {isDoctor && (
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Doctor's Comments & Notes</h2>
            <p className="text-sm text-gray-600 mb-3">Add your professional assessment and recommendations for this patient.</p>
            <textarea
              className="w-full input-field mb-4"
              rows="6"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add your professional comments, diagnosis notes, or recommendations..."
            />
            <Button 
              variant="primary" 
              onClick={handleSaveComments} 
              disabled={savingComments}
              className="w-full sm:w-auto"
            >
              {savingComments ? 'Saving...' : 'Save Comments'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultsPage

