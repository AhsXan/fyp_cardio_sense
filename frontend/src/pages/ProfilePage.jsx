import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../contexts/AuthContext'
import { userAPI } from '../services/api'

function ProfilePage() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    ...(user?.role === 'patient' && { age: '', gender: '', address: '', medical_history: '' }),
    ...(user?.role === 'doctor' && { pmc_registration_number: '', qualifications: '', specialty: '', affiliation: '', clinic_address: '' }),
    ...(user?.role === 'researcher' && { institution: '', department: '', research_field: '', research_id_or_orcid: '' }),
  })
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    phone: false,
    documents: false,
  })

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, ...user }))
      // Mock verification status
      setVerificationStatus({
        email: user.email_verified || false,
        phone: user.phone_verified || false,
        documents: user.documents_verified || false,
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await userAPI.updateProfile(formData)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Verification Status */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Verification Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Email Verification</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                verificationStatus.email
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {verificationStatus.email ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Phone Verification</span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                verificationStatus.phone
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {verificationStatus.phone ? 'Verified' : 'Pending'}
              </span>
            </div>
            {(user?.role === 'doctor' || user?.role === 'researcher') && (
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Documents Verification</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  verificationStatus.documents
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {verificationStatus.documents ? 'Verified' : 'Pending'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Profile Information</h2>
            {!editing ? (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => {
                  setEditing(false)
                  setFormData({ ...user })
                }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Input
              label="Full Name"
              name="full_name"
              value={formData.full_name || ''}
              onChange={handleChange}
              disabled={!editing}
            />
            
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              disabled={!editing}
            />
            
            <Input
              label="Phone"
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              disabled={!editing}
            />

            {/* Role-specific fields */}
            {user?.role === 'patient' && (
              <>
                <Input
                  label="Age"
                  type="number"
                  name="age"
                  value={formData.age || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    className="input-field"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  label="Address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                  <textarea
                    name="medical_history"
                    value={formData.medical_history || ''}
                    onChange={handleChange}
                    disabled={!editing}
                    rows="3"
                    className="input-field"
                  />
                </div>
              </>
            )}

            {user?.role === 'doctor' && (
              <>
                <Input
                  label="PMC Registration Number"
                  name="pmc_registration_number"
                  value={formData.pmc_registration_number || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Qualifications"
                  name="qualifications"
                  value={formData.qualifications || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Specialty"
                  name="specialty"
                  value={formData.specialty || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Affiliation"
                  name="affiliation"
                  value={formData.affiliation || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Clinic Address"
                  name="clinic_address"
                  value={formData.clinic_address || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </>
            )}

            {user?.role === 'researcher' && (
              <>
                <Input
                  label="Institution"
                  name="institution"
                  value={formData.institution || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Department"
                  name="department"
                  value={formData.department || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Research Field"
                  name="research_field"
                  value={formData.research_field || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
                <Input
                  label="Research ID or ORCID"
                  name="research_id_or_orcid"
                  value={formData.research_id_or_orcid || ''}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

