import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import FileUploader from '../components/FileUploader'
import Input from '../components/Input'
import Button from '../components/Button'
import { pcgAPI } from '../services/api'

function UploadPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({
    device: '',
    recording_time: '',
  })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('file', file)
      if (formData.device) {
        formDataToSend.append('device', formData.device)
      }
      if (formData.recording_time) {
        formDataToSend.append('recording_time', formData.recording_time)
      }

      const response = await pcgAPI.upload(formDataToSend, (progressPercent) => {
        setProgress(progressPercent)
      })

      // Navigate to results page
      navigate(`/results/${response.data.upload_id}`)
    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed. Please try again.')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Upload PCG Recording</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Upload a heart sound recording for AI-powered analysis</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* File Upload */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Audio File <span className="text-red-500">*</span>
              </label>
              <FileUploader
                onFileSelect={handleFileSelect}
                accept=".wav,.mp3"
                maxSizeMB={10}
                disabled={uploading}
              />
              {file && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
              <Input
                label="Device (Optional)"
                name="device"
                value={formData.device}
                onChange={handleChange}
                placeholder="e.g., Stethoscope Model X"
              />
              
              <Input
                label="Recording Time (Optional)"
                type="datetime-local"
                name="recording_time"
                value={formData.recording_time}
                onChange={handleChange}
              />
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={uploading || !file}
                className="flex-1 order-1"
              >
                {uploading ? 'Uploading...' : 'Upload & Analyze'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={uploading}
                className="order-2"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="card mt-4 sm:mt-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Upload Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm sm:text-base">
            <li>Supported formats: WAV, MP3</li>
            <li>Maximum file size: 10 MB</li>
            <li>Ensure good audio quality for accurate analysis</li>
            <li>Recording should contain clear S1 and S2 heart sounds</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default UploadPage

