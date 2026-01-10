/**
 * Reusable Button Component
 * - Supports multiple variants (primary, secondary, success, danger, etc.)
 * - Mobile-responsive sizing
 * - Disabled state handling
 * - Consistent styling across app
 */
function Button({ children, variant = 'primary', className = '', disabled = false, ...props }) {
  // Base styles applied to all buttons
  const baseClasses = 'px-4 sm:px-6 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
  
  // Variant-specific color schemes
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary-light focus:ring-primary',
    outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary-light focus:ring-primary',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }
  
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button

