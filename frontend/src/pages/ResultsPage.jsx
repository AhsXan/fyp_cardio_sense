import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import { pcgAPI } from '../services/api'

function ResultsPage() {
  const { uploadId } = useParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comments, setComments] = useState('')

  useEffect(() => {
    fetchResults()
  }, [uploadId])

  const fetchResults = async () => {
    try {
      const response = await pcgAPI.getResults(uploadId)
      setResults(response.data)
      if (response.data.comments) {
        setComments(response.data.comments)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (results?.report_pdf_url) {
      window.open(results.report_pdf_url, '_blank')
    } else {
      alert('Report is being generated. Please try again later.')
    }
  }

  const handleSaveComments = () => {
    // Mock save comments
    alert('Comments saved successfully!')
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
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Upload ID: {uploadId}</p>
        </div>

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
                <p className="text-sm sm:text-base">Waveform visualization will appear here</p>
                <p className="text-xs sm:text-sm mt-2">Timeline markers for S1 and S2 will be displayed</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Table */}
        <div className="card mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Analysis Results</h2>
          
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {results?.results && results.results.length > 0 ? (
              results.results.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">{result.label}</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      result.confidence >= 0.8
                        ? 'bg-green-100 text-green-800'
                        : result.confidence >= 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Start:</span>
                      <span className="ml-1 text-gray-900">{result.start_time}s</span>
                    </div>
                    <div>
                      <span className="text-gray-500">End:</span>
                      <span className="ml-1 text-gray-900">{result.end_time}s</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No results available</p>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time (s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time (s)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results?.results && results.results.length > 0 ? (
                  results.results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.label}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.start_time}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.end_time}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          result.confidence >= 0.8
                            ? 'bg-green-100 text-green-800'
                            : result.confidence >= 0.6
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                      No results available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

        {/* Comments/Notes Section */}
        <div className="card">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Comments & Notes</h2>
          <textarea
            className="w-full input-field mb-4"
            rows="6"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add your comments or notes about this analysis..."
          />
          <Button variant="primary" onClick={handleSaveComments} className="w-full sm:w-auto">
            Save Comments
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ResultsPage

