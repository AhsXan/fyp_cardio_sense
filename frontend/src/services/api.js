import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)
          // Retry original request
          error.config.headers.Authorization = `Bearer ${access_token}`
          return api.request(error.config)
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user_data')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth endpoints
export const authAPI = {
  signup: (role, data) => {
    // For FormData, axios will automatically set Content-Type with boundary
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {}
    return api.post(`/auth/signup/${role}`, data, config)
  },
  sendSignupOTP: (email) => api.post('/auth/send-signup-otp', { email }),
  verifySignupOTP: (userId, otp) => api.post('/auth/verify-signup-otp', { user_id: userId, otp }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  sendLoginOTP: (tempToken) => api.post('/auth/send-login-otp', { temp_token: tempToken }),
  verifyLoginOTP: (tempToken, otp) => api.post('/auth/verify-login-otp', { temp_token: tempToken, otp }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
}

// PCG endpoints
export const pcgAPI = {
  upload: (formData, onProgress) => {
    return api.post('/pcg/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      },
    })
  },
  getStatus: (uploadId) => api.get(`/pcg/${uploadId}/status`),
  getResults: (uploadId) => api.get(`/pcg/${uploadId}/results`),
  getUploads: () => api.get('/pcg/uploads'),
}

// User endpoints
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.patch('/user/profile', data),
  toggle2FA: (enabled) => api.post('/user/toggle-2fa', { enabled }),
}

// Doctor endpoints
export const doctorAPI = {
  getPatients: () => api.get('/doctor/patients'),
  getPendingApprovals: () => api.get('/doctor/pending-approvals'),
  approvePatient: (patientId) => api.post(`/doctor/approve-patient/${patientId}`),
}

// Researcher endpoints
export const researcherAPI = {
  requestDatasetAccess: (datasetId) => api.post('/researcher/request-dataset-access', { dataset_id: datasetId }),
  getDatasets: () => api.get('/researcher/datasets'),
}

