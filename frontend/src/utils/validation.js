export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  // E.164 format: +[country code][number]
  const re = /^\+[1-9]\d{1,14}$/
  return re.test(phone)
}

export const validatePassword = (password) => {
  // Minimum 8 characters, 1 uppercase, 1 lowercase, 1 digit
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return re.test(password)
}

export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp)
}

export const getValidationErrors = (field, value, rules) => {
  if (rules.required && !value) {
    return `${field} is required`
  }

  if (value) {
    if (rules.email && !validateEmail(value)) {
      return 'Invalid email format'
    }
    if (rules.phone && !validatePhone(value)) {
      return 'Invalid phone format. Use E.164 format (e.g., +1234567890)'
    }
    if (rules.password && !validatePassword(value)) {
      return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit'
    }
    if (rules.minLength && value.length < rules.minLength) {
      return `${field} must be at least ${rules.minLength} characters`
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${field} must be at most ${rules.maxLength} characters`
    }
    if (rules.match && value !== rules.match) {
      return 'Passwords do not match'
    }
  }

  return null
}

