import { validateEmail, validatePhone, validatePassword, getValidationErrors } from '../utils/validation'

describe('Validation utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate E.164 format phone numbers', () => {
      expect(validatePhone('+1234567890')).toBe(true)
      expect(validatePhone('+441234567890')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(false)
      expect(validatePhone('+123')).toBe(false)
      expect(validatePhone('123-456-7890')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate passwords with required criteria', () => {
      expect(validatePassword('Password123')).toBe(true)
      expect(validatePassword('MyP@ssw0rd')).toBe(true)
    })

    it('should reject passwords without uppercase', () => {
      expect(validatePassword('password123')).toBe(false)
    })

    it('should reject passwords without lowercase', () => {
      expect(validatePassword('PASSWORD123')).toBe(false)
    })

    it('should reject passwords without digits', () => {
      expect(validatePassword('Password')).toBe(false)
    })

    it('should reject passwords shorter than 8 characters', () => {
      expect(validatePassword('Pass1')).toBe(false)
    })
  })

  describe('getValidationErrors', () => {
    it('should return error for required fields', () => {
      const error = getValidationErrors('Full name', '', { required: true })
      expect(error).toBe('Full name is required')
    })

    it('should return null for valid required fields', () => {
      const error = getValidationErrors('Full name', 'John Doe', { required: true })
      expect(error).toBeNull()
    })

    it('should validate email format', () => {
      const error = getValidationErrors('Email', 'invalid-email', { email: true })
      expect(error).toBe('Invalid email format')
    })

    it('should validate phone format', () => {
      const error = getValidationErrors('Phone', '1234567890', { phone: true })
      expect(error).toBe('Invalid phone format. Use E.164 format (e.g., +1234567890)')
    })

    it('should validate password strength', () => {
      const error = getValidationErrors('Password', 'weak', { password: true })
      expect(error).toBe('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit')
    })

    it('should validate password match', () => {
      const error = getValidationErrors('Confirm password', 'password1', { 
        required: true, 
        match: 'password2' 
      })
      expect(error).toBe('Passwords do not match')
    })
  })
})

