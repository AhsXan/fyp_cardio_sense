import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Input from '../../components/Input'
import Button from '../../components/Button'
import OTPDialog from '../../components/OTPDialog'
import { authAPI } from '../../services/api'
import { getValidationErrors } from '../../utils/validation'

function ResearcherSignup() {
  const navigate = useNavigate()
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
  const [institutionIdFile, setInstitutionIdFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [userId, setUserId] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, institution_id: 'File size must be less than 5MB' }))
        return
      }
      setInstitutionIdFile(file)
      setErrors(prev => ({ ...prev, institution_id: null }))
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
      if (institutionIdFile) {
        formDataToSend.append('institution_id', institutionIdFile)
      }

      const response = await authAPI.signup('researcher', formDataToSend)
      setUserId(response.data.user_id)
      await authAPI.sendSignupOTP(formData.email)
      setShowOTP(true)
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Signup failed. Please try again.' })
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
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Institution ID
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="input-field"
                />
                {errors.institution_id && <p className="mt-1 text-sm text-red-600">{errors.institution_id}</p>}
                {institutionIdFile && (
                  <p className="mt-1 text-sm text-gray-600">Selected: {institutionIdFile.name}</p>
                )}
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

export default ResearcherSignup

