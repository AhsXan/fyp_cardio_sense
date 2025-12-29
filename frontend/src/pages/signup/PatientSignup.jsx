import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Input from '../../components/Input'
import Button from '../../components/Button'
import OTPDialog from '../../components/OTPDialog'
import { authAPI } from '../../services/api'
import { getValidationErrors } from '../../utils/validation'

function PatientSignup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    age: '',
    gender: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [userId, setUserId] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    newErrors.full_name = getValidationErrors('Full name', formData.full_name, { required: true, minLength: 2 })
    newErrors.email = getValidationErrors('Email', formData.email, { required: true, email: true })
    newErrors.phone = getValidationErrors('Phone', formData.phone, { required: true, phone: true })
    newErrors.password = getValidationErrors('Password', formData.password, { required: true, password: true })
    newErrors.confirm_password = getValidationErrors('Confirm password', formData.confirm_password, { 
      required: true, 
      match: formData.password 
    })

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    try {
      // Create FormData for multipart/form-data submission
      const formDataToSend = new FormData()
      formDataToSend.append('full_name', formData.full_name)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone', formData.phone)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('confirm_password', formData.confirm_password)
      
      // Optional patient fields
      if (formData.gender) formDataToSend.append('gender', formData.gender)
      if (formData.age) {
        // Convert age to date_of_birth (approximate)
        const birthYear = new Date().getFullYear() - parseInt(formData.age)
        formDataToSend.append('date_of_birth', `${birthYear}-01-01`)
      }
      
      const response = await authAPI.signup('patient', formDataToSend)

      setUserId(response.data.user_id)
      await authAPI.sendSignupOTP(formData.email)
      setShowOTP(true)
    } catch (error) {
      console.error('Signup error:', error.response?.data)
      let errorMessage = 'Signup failed. Please try again.'
      
      if (error.response?.data?.detail) {
        // Handle FastAPI validation errors
        if (Array.isArray(error.response.data.detail)) {
          // Validation errors from FastAPI are arrays
          errorMessage = error.response.data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
            return `${field}: ${err.msg}`
          }).join(', ')
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async (otp) => {
    try {
      await authAPI.verifySignupOTP(userId, otp)
      setShowOTP(false)
      navigate('/login', { state: { message: 'Account created successfully! Please log in.' } })
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP. Please try again.')
    }
  }

  const handleOTPResend = async () => {
    try {
      await authAPI.sendSignupOTP(formData.email)
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
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6">Patient Sign Up</h1>
            
            <form onSubmit={handleSubmit}>
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                error={errors.full_name}
              />
              
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
                label="Phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+923001234567 (country code + number)"
                required
                error={errors.phone}
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
              
              <Input
                label="Confirm Password"
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                error={errors.confirm_password}
              />
              
              <Input
                label="Age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
              />
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    required
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    I accept the terms and conditions <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {errors.submit}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
            
            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:text-primary-dark font-medium">
                Log in
              </a>
            </p>
          </div>
        </div>
      </div>

      <OTPDialog
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        onVerify={handleOTPVerify}
        onResend={handleOTPResend}
        email={formData.email}
      />
    </div>
  )
}

export default PatientSignup

