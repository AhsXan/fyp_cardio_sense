import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Button from '../../components/Button'
import Toast from '../../components/Toast'
import { researcherAPI } from '../../services/api'

function RequestDataset() {
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    try {
      const response = await researcherAPI.getDatasets()
      setDatasets(response.data.datasets || [])
    } catch (error) {
      console.error('Failed to fetch datasets:', error)
      setToast({ message: 'Failed to load datasets', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAccess = async (datasetId) => {
    setRequesting(datasetId)
    try {
      await researcherAPI.requestDatasetAccess({ dataset_id: datasetId })
      setToast({ message: 'Dataset access requested successfully! You will be notified once approved.', type: 'success' })
      // Refresh datasets to update status
      await fetchDatasets()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to request access. Please try again.'
      setToast({ message: errorMsg, type: 'error' })
    } finally {
      setRequesting(null)
    }
  }

  const handleDownload = (datasetId) => {
    // TODO: Implement download functionality
    setToast({ message: 'Dataset download will be available soon', type: 'info' })
  }

  const getStatusBadge = (status) => {
    const badges = {
      available: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Request Data Set</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Request access to anonymized datasets for your research
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
          </div>
        ) : datasets.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="card">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{dataset.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{dataset.description}</p>
                    {dataset.total_samples && (
                      <p className="text-xs text-gray-500 mt-2">
                        📊 {dataset.total_samples} samples
                      </p>
                    )}
                  </div>
                  <span className={`px-2 sm:px-3 py-1 text-xs rounded-full ml-3 ${getStatusBadge(dataset.status)}`}>
                    {dataset.status}
                  </span>
                </div>

                <div className="mt-4">
                  {dataset.status === 'available' ? (
                    <Button
                      variant="primary"
                      onClick={() => handleRequestAccess(dataset.id)}
                      disabled={requesting === dataset.id}
                      className="w-full sm:w-auto"
                    >
                      {requesting === dataset.id ? 'Requesting...' : 'Request Access'}
                    </Button>
                  ) : dataset.status === 'pending' ? (
                    <Button variant="secondary" disabled className="w-full sm:w-auto">
                      Access Requested
                    </Button>
                  ) : dataset.status === 'approved' ? (
                    <Button
                      variant="success"
                      onClick={() => handleDownload(dataset.id)}
                      className="w-full sm:w-auto"
                    >
                      Download Dataset
                    </Button>
                  ) : dataset.status === 'rejected' ? (
                    <p className="text-sm text-red-600">Request was rejected</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-4xl sm:text-5xl mb-4">📊</div>
            <p className="text-gray-500 text-sm sm:text-base">No datasets available at the moment</p>
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

export default RequestDataset
