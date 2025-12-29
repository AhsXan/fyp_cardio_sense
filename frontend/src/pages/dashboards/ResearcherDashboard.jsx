import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import { useAuth } from '../../contexts/AuthContext'
import { researcherAPI } from '../../services/api'

function ResearcherDashboard() {
  const { user } = useAuth()
  const [requesting, setRequesting] = useState(false)

  const quickActions = [
    {
      title: 'Request Data Set',
      description: 'Request access to anonymized datasets for research',
      icon: '📊',
      color: 'bg-blue-500',
    },
    {
      title: 'View Results',
      description: 'View analysis results and suggest improvements',
      icon: '🔬',
      color: 'bg-green-500',
    },
  ]

  // Mock datasets
  const availableDatasets = [
    { id: 1, name: 'Cardiac Sound Dataset 2024', description: 'Anonymized PCG recordings from 1000 patients', status: 'available' },
    { id: 2, name: 'ECG Analysis Dataset', description: 'ECG data with annotations', status: 'requested' },
    { id: 3, name: 'Long-term Monitoring Dataset', description: '24-hour monitoring data', status: 'available' },
  ]

  const handleRequestAccess = async (datasetId) => {
    setRequesting(true)
    try {
      await researcherAPI.requestDatasetAccess(datasetId)
      alert('Dataset access requested successfully. You will be notified once approved.')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request access. Please try again.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Researcher Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.full_name || 'Researcher'}!</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4`}>
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Data Set */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Request Data Set</h2>
            {availableDatasets.length > 0 ? (
              <div className="space-y-4">
                {availableDatasets.map((dataset) => (
                  <div key={dataset.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{dataset.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{dataset.description}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        dataset.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : dataset.status === 'requested'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dataset.status}
                      </span>
                    </div>
                    <div className="mt-4">
                      {dataset.status === 'available' ? (
                        <Button
                          variant="primary"
                          onClick={() => handleRequestAccess(dataset.id)}
                          disabled={requesting}
                          className="text-sm"
                        >
                          Request Access
                        </Button>
                      ) : dataset.status === 'requested' ? (
                        <Button variant="secondary" disabled className="text-sm">
                          Access Requested
                        </Button>
                      ) : (
                        <Button variant="primary" className="text-sm">
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No datasets available</p>
            )}
          </div>

          {/* View Results with Suggest Improvements */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">View Results</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Analysis Results</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review AI analysis results and provide feedback for improvements.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suggestions for Improvement
                    </label>
                    <textarea
                      className="w-full input-field"
                      rows="4"
                      placeholder="Enter your suggestions to improve the AI model..."
                    />
                  </div>
                  <Button variant="primary" className="w-full">
                    Submit Suggestions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResearcherDashboard

