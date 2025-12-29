# API Contract Documentation

This document describes the API endpoints that the frontend expects from the backend. All endpoints are currently mocked using MSW (Mock Service Worker) for development.

## Base URL

- Development: `/api` (mocked)
- Production: Set via `VITE_API_BASE_URL` environment variable

## Authentication

All protected endpoints require an `Authorization` header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST `/api/auth/signup/:role`
Create a new user account.

**Roles**: `patient`, `doctor`, `researcher`

**Request Body** (multipart/form-data for doctor/researcher):
```json
{
  "full_name": "string (required)",
  "email": "string (required)",
  "phone": "string (required, E.164 format)",
  "password": "string (required, min 8 chars)",
  "confirm_password": "string (required)",
  // Role-specific fields...
}
```

**Response** (201):
```json
{
  "user_id": 123,
  "pending_verification": true
}
```

---

#### POST `/api/auth/send-signup-otp`
Send OTP to user's email after signup.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

#### POST `/api/auth/verify-signup-otp`
Verify OTP during signup.

**Request Body**:
```json
{
  "user_id": 123,
  "otp": "123456"
}
```

**Response** (200):
```json
{
  "verified": true
}
```

---

#### POST `/api/auth/login`
Login user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200) - Without 2FA:
```json
{
  "user": {
    "id": 123,
    "full_name": "John Doe",
    "email": "user@example.com",
    "role": "patient"
  },
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here"
}
```

**Response** (200) - With 2FA:
```json
{
  "requires_otp": true,
  "temp_token": "temp_token_here"
}
```

---

#### POST `/api/auth/send-login-otp`
Send OTP for 2FA login.

**Request Body**:
```json
{
  "temp_token": "temp_token_here"
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

#### POST `/api/auth/verify-login-otp`
Verify OTP for 2FA login.

**Request Body**:
```json
{
  "temp_token": "temp_token_here",
  "otp": "123456"
}
```

**Response** (200):
```json
{
  "user": { ... },
  "access_token": "jwt_token_here",
  "refresh_token": "refresh_token_here"
}
```

---

#### POST `/api/auth/forgot-password`
Request password reset.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### PCG (Phonocardiogram) Endpoints

#### POST `/api/pcg/upload`
Upload a PCG audio file for analysis.

**Request**: `multipart/form-data`
- `file`: Audio file (WAV, MP3, max 10MB)
- `device`: Optional device name
- `recording_time`: Optional datetime

**Response** (201):
```json
{
  "upload_id": 456,
  "status": "queued"
}
```

---

#### GET `/api/pcg/:uploadId/status`
Get upload processing status.

**Response** (200):
```json
{
  "status": "processing" | "completed" | "failed",
  "progress": 75
}
```

---

#### GET `/api/pcg/:uploadId/results`
Get analysis results.

**Response** (200):
```json
{
  "upload_id": 456,
  "status": "completed",
  "results": [
    {
      "label": "S1" | "S2",
      "start_time": 0.1,
      "end_time": 0.2,
      "confidence": 0.95
    }
  ],
  "visualization_url": "https://...",
  "report_pdf_url": "https://...",
  "comments": ""
}
```

---

#### GET `/api/pcg/uploads`
Get list of user's uploads.

**Response** (200):
```json
{
  "uploads": [
    {
      "id": 456,
      "filename": "recording.wav",
      "status": "completed",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### User Endpoints

#### GET `/api/user/profile`
Get current user's profile.

**Response** (200):
```json
{
  "id": 123,
  "full_name": "John Doe",
  "email": "user@example.com",
  "phone": "+1234567890",
  "role": "patient",
  // Role-specific fields...
  "email_verified": true,
  "phone_verified": true,
  "two_fa_enabled": false
}
```

---

#### PATCH `/api/user/profile`
Update user profile.

**Request Body**:
```json
{
  "full_name": "John Doe",
  "phone": "+1234567890",
  // Other updatable fields...
}
```

**Response** (200):
```json
{
  // Updated user object
}
```

---

#### POST `/api/user/toggle-2fa`
Enable/disable two-factor authentication.

**Request Body**:
```json
{
  "enabled": true
}
```

**Response** (200):
```json
{
  "success": true,
  "enabled": true
}
```

---

### Doctor Endpoints

#### GET `/api/doctor/patients`
Get list of patients assigned to doctor.

**Response** (200):
```json
{
  "patients": [
    {
      "id": 123,
      "full_name": "Patient Name",
      "email": "patient@example.com"
    }
  ]
}
```

---

#### GET `/api/doctor/pending-approvals`
Get pending patient upload approvals.

**Response** (200):
```json
{
  "approvals": [
    {
      "id": 1,
      "patient_id": 123,
      "patient_name": "Patient Name",
      "upload_date": "2025-01-15",
      "status": "pending"
    }
  ]
}
```

---

#### POST `/api/doctor/approve-patient/:patientId`
Approve a patient's upload.

**Response** (200):
```json
{
  "success": true,
  "patient_id": 123
}
```

---

### Researcher Endpoints

#### POST `/api/researcher/request-dataset-access`
Request access to a dataset.

**Request Body**:
```json
{
  "dataset_id": 1
}
```

**Response** (200):
```json
{
  "success": true,
  "dataset_id": 1
}
```

---

#### GET `/api/researcher/datasets`
Get available datasets.

**Response** (200):
```json
{
  "datasets": [
    {
      "id": 1,
      "name": "Dataset Name",
      "description": "Dataset description",
      "status": "available" | "requested" | "approved"
    }
  ]
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

**Status Code**: 4xx or 5xx

**Response Body**:
```json
{
  "message": "Error message description"
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Switching from Mocks to Real Backend

1. Set `VITE_API_BASE_URL` environment variable to your backend URL
2. Ensure your backend implements all endpoints described above
3. Update CORS settings on your backend to allow requests from your frontend domain
4. The frontend will automatically use the real API instead of mocks

## Notes

- All timestamps should be in ISO 8601 format
- File uploads use `multipart/form-data`
- OTP codes are 6-digit numeric strings
- Phone numbers must be in E.164 format (e.g., +1234567890)
- Passwords must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit

