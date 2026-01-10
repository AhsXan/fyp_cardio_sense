/**
 * Form Validation Utilities
 * - Email, phone, password, OTP validators
 * - Returns validation errors for forms
 * - Used across all signup/login forms
 */

// Validate email format (basic regex)
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Validate phone in E.164 format: +[country code][number]
export const validatePhone = (phone) => {
  // E.164 format: +[country code][number]
  const re = /^\+[1-9]\d{1,14}$/
  return re.test(phone)
}

// Validate password strength: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
export const validatePassword = (password) => {
  // Minimum 8 characters, 1 uppercase, 1 lowercase, 1 digit
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return re.test(password)
}

// Validate OTP: exactly 6 digits
export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp)
}

// Comprehensive validation function with custom rules
// Returns error message or null if valid
export const getValidationErrors = (field, value, rules) => {
  // Check if required field is empty
  if (rules.required && !value) {
    return `${field} is required`
  }

  if (value) {
    // Validate email format
    if (rules.email && !validateEmail(value)) {
      return 'Invalid email format'
    }
    // Validate phone format
    if (rules.phone && !validatePhone(value)) {
      return 'Invalid phone format. Use E.164 format (e.g., +1234567890)'
    }
    // Validate password strength
    if (rules.password && !validatePassword(value)) {
      return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit'
    }
    // Check minimum length
    if (rules.minLength && value.length < rules.minLength) {
      return `${field} must be at least ${rules.minLength} characters`
    }
    // Check maximum length
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${field} must be at most ${rules.maxLength} characters`
    }
    // Check if values match (for confirm password)
    if (rules.match && value !== rules.match) {
      return 'Passwords do not match'
    }
  }

  return null
}

