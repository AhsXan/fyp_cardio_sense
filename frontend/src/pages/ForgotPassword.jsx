import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Input from '../components/Input'
import Button from '../components/Button'
import { authAPI } from '../services/api'
import { getValidationErrors } from '../utils/validation'

function ForgotPassword() {
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1) // 1: Email, 2: OTP + New Password
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [otpSent, setOtpSent] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
    if (message) setMessage(null)
  }

  const validateEmail = () => {
    const newErrors = {}
    newErrors.email = getValidationErrors('Email', formData.email, { required: true, email: true })
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== null)
  }

  const validateReset = () => {
    const newErrors = {}
    newErrors.otp = getValidationErrors('OTP', formData.otp, { required: true, minLength: 6, maxLength: 6 })
    newErrors.newPassword = getValidationErrors('New Password', formData.newPassword, { required: true, minLength: 8, password: true })
    
    if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== null)
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    
    if (!validateEmail()) return

    setLoading(true)
    setMessage(null)
    try {
      await authAPI.forgotPassword(formData.email)
      setOtpSent(true)
      setStep(2)
      setMessage({
        type: 'success',
        text: '✅ OTP sent! Check the backend terminal for your OTP code.'
      })
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to send OTP. Please try again.'
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (!validateReset()) return

    setLoading(true)
    setMessage(null)
    try {
      await authAPI.resetPassword(formData.otp, formData.newPassword, formData.confirmPassword)
      setMessage({
        type: 'success',
        text: '✅ Password reset successful! Redirecting to login...'
      })
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successful. Please login with your new password.' } 
        })
      }, 2000)
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to reset password. Please check your OTP.'
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await authAPI.forgotPassword(formData.email)
      setMessage({
        type: 'success',
        text: '✅ OTP resent! Check the backend terminal for your new OTP code.'
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to resend OTP. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-light to-white">
      <Navbar isPublic />
      
      <div className="flex-grow flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="max-w-md w-full">
          <div className="card">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Reset Password</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {step === 1 ? 'Enter your email to receive an OTP' : 'Enter OTP and new password'}
              </p>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-600' 
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {message.text}
              </div>
            )}

            {/* Step 1: Email Input */}
            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  error={errors.email}
                  placeholder="Enter your registered email"
                />

                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {errors.submit}
                  </div>
                )}
                
                <Button type="submit" className="w-full mb-4" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-primary hover:text-primary-dark">
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}

            {/* Step 2: OTP + New Password */}
            {step === 2 && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                  📧 <strong>OTP sent to backend terminal!</strong> Check the terminal where your backend is running.
                </div>

                <Input
                  label="OTP Code"
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                  error={errors.otp}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />

                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  error={errors.newPassword}
                  placeholder="Enter new password (min 8 characters)"
                />
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                  <p className="font-semibold mb-1">Password Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>At least 8 characters long</li>
                    <li>Contains at least one uppercase letter (A-Z)</li>
                    <li>Contains at least one lowercase letter (a-z)</li>
                    <li>Contains at least one digit (0-9)</li>
                  </ul>
                </div>

                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  error={errors.confirmPassword}
                  placeholder="Re-enter new password"
                />

                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {errors.submit}
                  </div>
                )}
                
                <Button type="submit" className="w-full mb-3" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full mb-4" 
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-primary hover:text-primary-dark">
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
