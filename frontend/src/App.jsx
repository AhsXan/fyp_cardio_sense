/**
 * Main App Component - Defines all application routes
 * - Wraps everything in AuthProvider for global auth state
 * - Configures protected routes with role-based access
 * - Maps URLs to page components
 */
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import RoleSelection from './pages/RoleSelection'
import PatientSignup from './pages/signup/PatientSignup'
import DoctorSignup from './pages/signup/DoctorSignup'
import ResearcherSignup from './pages/signup/ResearcherSignup'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ProtectedRoute from './components/ProtectedRoute'
import PatientDashboard from './pages/dashboards/PatientDashboard'
import DoctorDashboard from './pages/dashboards/DoctorDashboard'
import ResearcherDashboard from './pages/dashboards/ResearcherDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import ManageUsers from './pages/dashboards/ManageUsers'
import SystemStats from './pages/dashboards/SystemStats'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ProfilePage from './pages/ProfilePage'
import RequestDataset from './pages/researcher/RequestDataset'
import ViewResults from './pages/researcher/ViewResults'

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/select-role" element={<RoleSelection />} />
        <Route path="/signup/patient" element={<PatientSignup />} />
        <Route path="/signup/doctor" element={<DoctorSignup />} />
        <Route path="/signup/researcher" element={<ResearcherSignup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Patient Routes */}
        <Route
          path="/dashboard/patient"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Doctor Routes */}
        <Route
          path="/dashboard/doctor"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Researcher Routes */}
        <Route
          path="/dashboard/researcher"
          element={
            <ProtectedRoute requiredRole="researcher">
              <ResearcherDashboard />
            </ProtectedRoute>
          }
        />
        {/* Alternate researcher dashboard route */}
        <Route
          path="/researcher-dashboard"
          element={
            <ProtectedRoute requiredRole="researcher">
              <ResearcherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/researcher/request-dataset"
          element={
            <ProtectedRoute requiredRole="researcher">
              <RequestDataset />
            </ProtectedRoute>
          }
        />
        <Route
          path="/researcher/view-results"
          element={
            <ProtectedRoute requiredRole="researcher">
              <ViewResults />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Admin Routes */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* Alternate admin dashboard route */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-users"
          element={
            <ProtectedRoute requiredRole="admin">
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system-stats"
          element={
            <ProtectedRoute requiredRole="admin">
              <SystemStats />
            </ProtectedRoute>
          }
        />
        
        {/* Shared Protected Routes (all authenticated users) */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        {/* Dynamic route for viewing individual result */}
        <Route
          path="/results/:uploadId"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App

