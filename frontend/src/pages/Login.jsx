import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Input from '../components/Input'
import Button from '../components/Button'
import OTPDialog from '../components/OTPDialog'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { getValidationErrors } from '../utils/validation'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, logout, isAuthenticated } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [tempToken, setTempToken] = useState(null)
  const [message, setMessage] = useState(null)

  // Auto-logout if user is already authenticated and visits login page
  useEffect(() => {
    if (isAuthenticated) {
      logout()
    }
  }, [])

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
    }
  }, [location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    newErrors.email = getValidationErrors('Email', formData.email, { required: true, email: true })
    newErrors.password = getValidationErrors('Password', formData.password, { required: true })
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    setMessage(null)
    try {
      const response = await authAPI.login(formData.email, formData.password)
      
      if (response.data.requires_otp) {
        setTempToken(response.data.temp_token)
        await authAPI.sendLoginOTP(response.data.temp_token)
        setShowOTP(true)
      } else {
        // Direct login without 2FA
        login(response.data.user, {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
        })
        navigate(`/dashboard/${response.data.user.role}`)
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Login failed. Please check your credentials.'
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async (otp) => {
    try {
      const response = await authAPI.verifyLoginOTP(tempToken, otp)
      login(response.data.user, {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      })
      setShowOTP(false)
      navigate(`/dashboard/${response.data.user.role}`)
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP. Please try again.')
    }
  }

  const handleOTPResend = async () => {
    try {
      await authAPI.sendLoginOTP(tempToken)
    } catch (error) {
      alert('Failed to resend OTP. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-light to-white">
      <Navbar isPublic />
      
      <div className="flex-grow flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="max-w-md w-full">
          <div className="card">
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Welcome to our community</h1>
            <p className="text-center text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Sign in to your account</p>
            
            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                error={errors.email}
              />
              
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                error={errors.password}
              />
              
              <div className="mb-4 text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                  Forgot password?
                </Link>
              </div>

              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errors.submit}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'SIGN IN'}
              </Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/select-role" className="text-primary hover:text-primary-dark font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <OTPDialog
        isOpen={showOTP}
        onClose={() => {
          setShowOTP(false)
          setTempToken(null)
        }}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        email={formData.email}
      />
    </div>
  )
}

export default Login

