import { http, HttpResponse } from 'msw'

// Mock users database
const mockUsers = {
  'raja3.ahsan@gmail.com': {
    id: 1,
    full_name: 'Raja Ahsan',
    email: 'raja3.ahsan@gmail.com',
    phone: '+1234567890',
    role: 'doctor',
    pmc_registration_number: 'PMC12345',
    qualifications: 'MBBS, MD',
    specialty: 'cardiology',
    email_verified: true,
    phone_verified: true,
    documents_verified: true,
    two_fa_enabled: false,
  },
  'ahsan3.dev@gmail.com': {
    id: 2,
    full_name: 'Ahsan Dev',
    email: 'ahsan3.dev@gmail.com',
    phone: '+1234567891',
    role: 'researcher',
    institution: 'Research University',
    department: 'Cardiology Research',
    email_verified: true,
    phone_verified: true,
    documents_verified: true,
    two_fa_enabled: false,
  },
  'ahsan3.aahmed@gmail.com': {
    id: 3,
    full_name: 'Ahsan Ahmed',
    email: 'ahsan3.aahmed@gmail.com',
    phone: '+1234567892',
    role: 'patient',
    age: 35,
    gender: 'male',
    email_verified: true,
    phone_verified: true,
    two_fa_enabled: false,
  },
}

// Mock uploads database
const mockUploads = {}
let uploadIdCounter = 1

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/signup/:role', async ({ request, params }) => {
    const { role } = params
    const formData = await request.formData()
    const data = Object.fromEntries(formData)
    
    // Simulate user creation
    const userId = Date.now()
    
    return HttpResponse.json({
      user_id: userId,
      pending_verification: true,
    }, { status: 201 })
  }),

  http.post('/api/auth/send-signup-otp', async ({ request }) => {
    const { email } = await request.json()
    // Mock OTP sending
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/auth/verify-signup-otp', async ({ request }) => {
    const { user_id, otp } = await request.json()
    // Accept any 6-digit OTP for mock
    if (/^\d{6}$/.test(otp)) {
      return HttpResponse.json({ verified: true })
    }
    return HttpResponse.json(
      { message: 'Invalid OTP' },
      { status: 400 }
    )
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json()
    
    // Check if user exists in mock database
    const user = mockUsers[email]
    
    if (!user || password !== 'password123') {
      return HttpResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if 2FA is enabled
    if (user.two_fa_enabled) {
      const tempToken = `temp_${Date.now()}`
      return HttpResponse.json({
        requires_otp: true,
        temp_token: tempToken,
      })
    }

    // Direct login
    const tokens = {
      access_token: `access_${Date.now()}`,
      refresh_token: `refresh_${Date.now()}`,
    }

    return HttpResponse.json({
      user,
      ...tokens,
    })
  }),

  http.post('/api/auth/send-login-otp', async ({ request }) => {
    const { temp_token } = await request.json()
    // Mock OTP sending
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/auth/verify-login-otp', async ({ request }) => {
    const { temp_token, otp } = await request.json()
    // Accept any 6-digit OTP for mock
    if (/^\d{6}$/.test(otp)) {
      // Find user by temp token (simplified - in real app, temp token would map to user)
      const user = mockUsers['raja3.ahsan@gmail.com'] // Default for demo
      const tokens = {
        access_token: `access_${Date.now()}`,
        refresh_token: `refresh_${Date.now()}`,
      }
      return HttpResponse.json({
        user,
        ...tokens,
      })
    }
    return HttpResponse.json(
      { message: 'Invalid OTP' },
      { status: 400 }
    )
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    const { email } = await request.json()
    // Mock password reset
    return HttpResponse.json({ success: true })
  }),

  // PCG endpoints
  http.post('/api/pcg/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return HttpResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      )
    }

    const uploadId = uploadIdCounter++
    mockUploads[uploadId] = {
      id: uploadId,
      filename: file.name,
      status: 'queued',
      progress: 0,
      created_at: new Date().toISOString(),
    }

    // Simulate processing
    setTimeout(() => {
      if (mockUploads[uploadId]) {
        mockUploads[uploadId].status = 'processing'
        mockUploads[uploadId].progress = 50
      }
    }, 1000)

    setTimeout(() => {
      if (mockUploads[uploadId]) {
        mockUploads[uploadId].status = 'completed'
        mockUploads[uploadId].progress = 100
      }
    }, 3000)

    return HttpResponse.json({
      upload_id: uploadId,
      status: 'queued',
    }, { status: 201 })
  }),

  http.get('/api/pcg/:uploadId/status', ({ params }) => {
    const { uploadId } = params
    const upload = mockUploads[uploadId]
    
    if (!upload) {
      return HttpResponse.json(
        { message: 'Upload not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      status: upload.status,
      progress: upload.progress,
    })
  }),

  http.get('/api/pcg/:uploadId/results', ({ params }) => {
    const { uploadId } = params
    const upload = mockUploads[uploadId]
    
    if (!upload) {
      return HttpResponse.json(
        { message: 'Upload not found' },
        { status: 404 }
      )
    }

    if (upload.status !== 'completed') {
      return HttpResponse.json(
        { message: 'Analysis not completed yet' },
        { status: 400 }
      )
    }

    // Mock results
    return HttpResponse.json({
      upload_id: uploadId,
      status: 'completed',
      results: [
        {
          label: 'S1',
          start_time: 0.1,
          end_time: 0.2,
          confidence: 0.95,
        },
        {
          label: 'S2',
          start_time: 0.4,
          end_time: 0.5,
          confidence: 0.92,
        },
        {
          label: 'S1',
          start_time: 0.8,
          end_time: 0.9,
          confidence: 0.88,
        },
      ],
      visualization_url: null, // Can be a placeholder image URL
      report_pdf_url: null, // Can be a placeholder PDF URL
      comments: '',
    })
  }),

  http.get('/api/pcg/uploads', () => {
    return HttpResponse.json({
      uploads: Object.values(mockUploads),
    })
  }),

  // User endpoints
  http.get('/api/user/profile', () => {
    // In real app, this would get user from token
    const user = mockUsers['ahsan3.aahmed@gmail.com']
    return HttpResponse.json(user)
  }),

  http.patch('/api/user/profile', async ({ request }) => {
    const data = await request.json()
    // Mock update
    return HttpResponse.json({
      ...mockUsers['ahsan3.aahmed@gmail.com'],
      ...data,
    })
  }),

  http.post('/api/user/toggle-2fa', async ({ request }) => {
    const { enabled } = await request.json()
    // Mock toggle
    return HttpResponse.json({ success: true, enabled })
  }),

  // Doctor endpoints
  http.get('/api/doctor/patients', () => {
    return HttpResponse.json({
      patients: [
        mockUsers['ahsan3.aahmed@gmail.com'],
      ],
    })
  }),

  http.get('/api/doctor/pending-approvals', () => {
    return HttpResponse.json({
      approvals: [
        {
          id: 1,
          patient_id: 3,
          patient_name: 'Ahsan Ahmed',
          upload_date: '2025-01-15',
          status: 'pending',
        },
      ],
    })
  }),

  http.post('/api/doctor/approve-patient/:patientId', ({ params }) => {
    const { patientId } = params
    return HttpResponse.json({ success: true, patient_id: patientId })
  }),

  // Researcher endpoints
  http.post('/api/researcher/request-dataset-access', async ({ request }) => {
    const { dataset_id } = await request.json()
    return HttpResponse.json({ success: true, dataset_id })
  }),

  http.get('/api/researcher/datasets', () => {
    return HttpResponse.json({
      datasets: [
        {
          id: 1,
          name: 'Cardiac Sound Dataset 2024',
          description: 'Anonymized PCG recordings from 1000 patients',
          status: 'available',
        },
        {
          id: 2,
          name: 'ECG Analysis Dataset',
          description: 'ECG data with annotations',
          status: 'requested',
        },
      ],
    })
  }),
]

