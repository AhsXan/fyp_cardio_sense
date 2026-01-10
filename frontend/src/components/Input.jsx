/**
 * Reusable Input Component
 * - Supports text, email, password, number, etc.
 * - Password visibility toggle (eye icon)
 * - Error message display
 * - Required field indicator (*)
 */
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function Input({ label, error, required = false, className = '', type, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="mb-4">
      {/* Label with required indicator */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Input field - shows text if password toggle is on */}
        <input
          className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className} ${isPassword ? 'pr-10' : ''}`}
          type={isPassword && showPassword ? 'text' : type}
          {...props}
        />
        {/* Password visibility toggle button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {/* Error message display */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default Input

