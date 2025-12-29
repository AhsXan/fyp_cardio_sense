function Button({ children, variant = 'primary', className = '', disabled = false, ...props }) {
  const baseClasses = 'px-4 sm:px-6 py-3 sm:py-2 min-h-[44px] rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary-light focus:ring-primary',
    outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary-light focus:ring-primary',
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

