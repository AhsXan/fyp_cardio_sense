import { useState, useEffect, useRef } from 'react'
import Button from './Button'

function OTPDialog({ isOpen, onClose, onVerify, onResend, email }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef([])

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', ''])
      setCountdown(60)
      inputRefs.current[0]?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp]
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || ''
      }
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = () => {
    const otpString = otp.join('')
    if (otpString.length === 6) {
      onVerify(otpString)
    }
  }

  const handleResend = () => {
    if (countdown === 0) {
      setCountdown(60)
      onResend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          We've sent a 6-digit code to <strong className="break-all">{email}</strong>
        </p>
        
        <div className="flex justify-between gap-1 sm:gap-2 mb-4 sm:mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleVerify} disabled={otp.join('').length !== 6} className="w-full">
            Verify
          </Button>
          
          <div className="text-center text-xs sm:text-sm text-gray-600">
            Didn't receive the code?{' '}
            {countdown > 0 ? (
              <span className="text-gray-400">Resend in {countdown}s</span>
            ) : (
              <button
                onClick={handleResend}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Resend Code
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 text-xs sm:text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default OTPDialog

