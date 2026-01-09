import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Navbar from '../../components/Navbar'
import Input from '../../components/Input'
import Button from '../../components/Button'
import OTPDialog from '../../components/OTPDialog'
import { authAPI } from '../../services/api'
import { getValidationErrors } from '../../utils/validation'

function ResearcherSignup() {
  const navigate = useNavigate()
  const { logout, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    institution: '',
    department: '',
    research_field: '',
    research_id_or_orcid: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [signupToken, setSignupToken] = useState(null)

  // Auto-logout if user is already authenticated and visits signup page
  useEffect(() => {
    if (isAuthenticated) {
      logout()
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
    newErrors.institution = getValidationErrors('Institution', formData.institution, { required: true })

    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key])
        }
      })

      const response = await authAPI.signup('researcher', formDataToSend)
      // OTP is now sent automatically during signup
      setSignupToken(response.data.signup_token)
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
      await authAPI.verifySignupOTP(signupToken, otp)
      setShowOTP(false)
      navigate('/login', { state: { message: 'Account created successfully! Please log in.' } })
    } catch (error) {
      alert(error.response?.data?.detail || 'Invalid OTP. Please try again.')
    }
  }

  const handleOTPResend = async () => {
    // Resend not available - user needs to signup again if OTP expires
    alert('OTP expired. Please sign up again.')
    setShowOTP(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-light to-white">
      <Navbar isPublic />
      
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="card">
            <h1 className="text-3xl font-bold text-center mb-6">Researcher Sign Up</h1>
            
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
                placeholder="+1234567890"
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
                label="Institution"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                required
                error={errors.institution}
              />
              
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
              />
              
              <Input
                label="Research Field"
                name="research_field"
                value={formData.research_field}
                onChange={handleChange}
              />
              
              <Input
                label="Research ID or ORCID (Optional)"
                name="research_id_or_orcid"
                value={formData.research_id_or_orcid}
                onChange={handleChange}
              />

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

export default ResearcherSignup

