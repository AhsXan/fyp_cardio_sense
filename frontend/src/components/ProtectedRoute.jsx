/**
 * Protected Route Component - Handles route authorization
 * - Redirects to login if not authenticated
 * - Redirects to correct dashboard if wrong role
 * - Shows loading spinner while checking auth
 * - Used to wrap all protected pages
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children, requiredRole = null }) {
  const { isAuthenticated, user, loading } = useAuth()

  // Show loading spinner while checking localStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in - redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Wrong role - redirect to their correct dashboard
  // e.g., patient trying to access doctor route → redirect to patient dashboard
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={`/dashboard/${user?.role}`} replace />
  }

  // Authorized - show the protected page
  return children
}

export default ProtectedRoute

