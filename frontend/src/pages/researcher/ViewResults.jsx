import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import Toast from '../../components/Toast'
import { researcherAPI } from '../../services/api'

function ViewResults() {
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState(null)
  const [suggestion, setSuggestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchReviewedResults()
  }, [])

  const fetchReviewedResults = async () => {
    try {
      const response = await researcherAPI.getReviewedResults()
      setResults(response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch results:', error)
      const errorMsg = error.response?.status === 401 
        ? 'Please log in as a researcher to view results'
        : error.response?.data?.detail || 'Failed to load results. Please try again later.'
      setToast({ message: errorMsg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (result) => {
    setSelectedResult(result)
    setSuggestion(result.researcher_suggestion || '')
  }

  const handleSubmitSuggestion = async () => {
    if (!suggestion.trim()) {
      setToast({ message: 'Please enter a suggestion before submitting', type: 'warning' })
      return
    }

    setSubmitting(true)
    try {
      await researcherAPI.submitSuggestion(selectedResult.upload_id, suggestion)
      setToast({ message: 'Suggestion submitted successfully!', type: 'success' })
      // Refresh results
      await fetchReviewedResults()
      setSelectedResult(null)
      setSuggestion('')
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to submit suggestion. Please try again.'
      setToast({ message: errorMsg, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const getClassificationBadge = (classification) => {
    return classification === 'NORMAL' 
      ? 'bg-green-100 text-green-800 border border-green-300'
      : 'bg-red-100 text-red-800 border border-red-300'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="secondary" onClick={() => navigate('/researcher-dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">View Results</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Review doctor-analyzed results and provide improvement suggestions
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Results List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Analysis Results</h2>
                
                {results.length > 0 ? (
                  <div className="space-y-3">
                    {results.map((result) => (
                      <div
                        key={result.upload_id}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-primary cursor-pointer transition-colors"
                        onClick={() => handleViewDetails(result)}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base">Upload #{result.upload_id}</h3>
                            <p className="text-xs text-gray-500">
                              Patient: {result.patient_name || 'Anonymous'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 text-xs rounded ${getClassificationBadge(result.ai_classification)}`}>
                              AI: {result.ai_classification}
                            </span>
                            {result.doctor_classification && (
                              <span className={`px-2 py-1 text-xs rounded ${getClassificationBadge(result.doctor_classification)}`}>
                                Doctor: {result.doctor_classification}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 mt-2">
                          <p>📅 {new Date(result.created_at).toLocaleDateString()}</p>
                          {result.doctor_comments && (
                            <p className="mt-1 line-clamp-2">💬 {result.doctor_comments}</p>
                          )}
                        </div>
                        
                        {result.researcher_suggestion && (
                          <div className="mt-2 bg-blue-50 p-2 rounded text-xs">
                            <span className="font-medium text-blue-800">Your suggestion submitted</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8 text-sm">No results available</p>
                )}
              </div>
            </div>

            {/* Suggestion Form */}
            <div className="lg:col-span-1">
              <div className="card sticky top-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">Suggestions for Improvement</h2>
                
                {selectedResult ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      <p className="font-medium mb-2">Selected Result</p>
                      <p className="text-xs text-gray-600">Upload #{selectedResult.upload_id}</p>
                      <div className="mt-2 flex gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${getClassificationBadge(selectedResult.ai_classification)}`}>
                          AI: {selectedResult.ai_classification}
                        </span>
                        {selectedResult.doctor_classification && (
                          <span className={`px-2 py-1 text-xs rounded ${getClassificationBadge(selectedResult.doctor_classification)}`}>
                            Dr: {selectedResult.doctor_classification}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Suggestions
                      </label>
                      <textarea
                        className="w-full input-field text-sm"
                        rows="8"
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        placeholder="Provide detailed suggestions to improve the AI model's accuracy, detection methods, or analysis quality..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Consider: false positives/negatives, edge cases, pattern recognition improvements
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={handleSubmitSuggestion}
                        disabled={submitting}
                        className="flex-1"
                      >
                        {submitting ? 'Submitting...' : 'Submit Suggestion'}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedResult(null)
                          setSuggestion('')
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">💡</div>
                    <p className="text-sm text-gray-500">
                      Select a result from the list to provide suggestions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default ViewResults
