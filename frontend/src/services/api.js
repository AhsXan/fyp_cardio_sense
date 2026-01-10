/**
 * Central API service for all backend communication
 * - Configures axios with base URL and interceptors
 * - Auto-attaches JWT tokens to requests
 * - Handles token refresh on 401 errors
 */
import axios from 'axios'

// Backend API base URL from environment or default to /api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: Auto-attach JWT token from localStorage to every API request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: Auto-refresh expired access tokens using refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Access token expired, try to refresh it
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
          // Refresh token also expired/invalid, force logout
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

// === AUTH ENDPOINTS ===
// Handles signup, login, OTP verification, password reset
export const authAPI = {
  // Signup with role (patient/doctor/researcher) - supports FormData for file uploads
  signup: (role, data) => {
    // Auto-detect FormData and set appropriate Content-Type
    const config = data instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    } : {}
    return api.post(`/auth/signup/${role}`, data, config)
  },
  // Verify OTP during signup (creates user in database after verification)
  verifySignupOTP: (signupToken, otp) => api.post('/auth/verify-signup-otp', { signup_token: signupToken, otp }),
  // Login with email and password
  login: (email, password) => api.post('/auth/login', { email, password }),
  // Send OTP for 2FA during login
  sendLoginOTP: (tempToken) => api.post('/auth/send-login-otp', { temp_token: tempToken }),
  // Verify 2FA OTP during login
  verifyLoginOTP: (tempToken, otp) => api.post('/auth/verify-login-otp', { temp_token: tempToken, otp }),
  // Request password reset (sends OTP)
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  // Reset password with OTP token
  resetPassword: (token, newPassword, confirmPassword) => api.post('/auth/reset-password', { 
    token, 
    new_password: newPassword, 
    confirm_password: confirmPassword 
  }),
}

// === PCG (HEART SOUND) ENDPOINTS ===
// Handles file uploads, AI analysis, results, and report downloads
export const pcgAPI = {
  // Upload heart sound file (auto-runs AI analysis)
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
  // Get processing status of an upload
  getStatus: (uploadId) => api.get(`/pcg/${uploadId}/status`),
  // Get AI analysis results for an upload
  getResults: (uploadId) => api.get(`/pcg/${uploadId}/results`),
  // Get all uploads for current user
  getUploads: () => api.get('/pcg/uploads'),
  // Download PDF report (returns binary data)
  downloadReport: (uploadId) => api.get(`/pcg/${uploadId}/download-report`, {
    responseType: 'blob'
  }),
}

// === USER PROFILE ENDPOINTS ===
// Handles profile viewing, updating, and 2FA settings
export const userAPI = {
  // Get current user's profile
  getProfile: () => api.get('/user/profile'),
  // Update profile information
  updateProfile: (data) => api.patch('/user/profile', data),
  // Enable/disable two-factor authentication
  toggle2FA: (enabled) => api.post('/user/toggle-2fa', { enabled }),
}

// === DOCTOR ENDPOINTS ===
// Handles patient management, result review, and medical comments
export const doctorAPI = {
  // Get doctor dashboard statistics
  getDashboard: () => api.get('/doctor/dashboard'),
  // Get all patients associated with this doctor
  getPatients: () => api.get('/doctor/patients'),
  // Get patients pending approval requests
  getPendingApprovals: () => api.get('/doctor/pending-approvals'),
  // Approve patient access request (optionally for specific upload)
  approvePatient: (patientId, uploadId) => api.post(`/doctor/approve-patient/${patientId}`, null, {
    params: uploadId ? { upload_id: uploadId } : {}
  }),
  // Get all uploads for a specific patient
  getPatientUploads: (patientId) => api.get(`/doctor/patient/${patientId}/uploads`),
  // Get detailed results for a patient's upload
  getPatientResults: (patientId, uploadId) => api.get(`/doctor/patient/${patientId}/results/${uploadId}`),
  // Review/override AI analysis with doctor's diagnosis
  reviewAnalysis: (uploadId, data) => api.post(`/doctor/review/${uploadId}`, data),
  // Add medical comment to a result
  addComment: (uploadId, comment) => api.post(`/doctor/add-comment/${uploadId}`, { comment }),
}

// === RESEARCHER ENDPOINTS ===
// Handles dataset access requests and research suggestions
export const researcherAPI = {
  // Request access to anonymized dataset for research
  requestDatasetAccess: (data) => api.post('/researcher/request-dataset-access', data),
  // Get available datasets
  getDatasets: () => api.get('/researcher/datasets'),
  // Get researcher's granted access requests
  getMyAccess: () => api.get('/researcher/my-access'),
  // Get doctor-reviewed results (accessible to researchers)
  getReviewedResults: () => api.get('/researcher/reviewed-results'),
  // Submit research suggestion for a result (visible to patient)
  submitSuggestion: (uploadId, suggestion) => api.post(`/researcher/suggest/${uploadId}`, { suggestion }),
}

// === ADMIN ENDPOINTS ===
// Handles user management, approvals, and system statistics
export const adminAPI = {
  // Get system statistics (users, uploads, analyses)
  getStats: () => api.get('/admin/stats'),
  // Get pending doctor/researcher approvals
  getPendingApprovals: () => api.get('/admin/pending-approvals'),
  // Approve doctor/researcher registration
  approveUser: (userId) => api.post(`/admin/approve/${userId}`),
  // Reject doctor/researcher registration with reason
  rejectUser: (userId, reason) => api.post(`/admin/reject/${userId}`, { reason }),
  // Get all users with filtering/pagination
  getUsers: (params) => api.get('/admin/users', { params }),
  // Perform action on user (suspend, activate, delete)
  userAction: (userId, action) => api.post(`/admin/users/${userId}/action`, { action }),
  // Get recent system activity logs
  getRecentActivity: () => api.get('/admin/recent-activity'),
  // Test AI model prediction (debug/testing feature)
  testAIPrediction: (formData) => api.post('/ai/test-predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // Get all dataset access requests from researchers
  getDatasetRequests: () => api.get('/admin/dataset-access-requests'),
  // Approve/reject researcher's dataset access request
  reviewDatasetRequest: (requestId, data) => api.post(`/admin/dataset-access/${requestId}/review`, data),
}

