import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'

import Login          from './pages/Login'
import Dashboard      from './pages/Dashboard'
import Submit         from './pages/Submit'
import Insights       from './pages/Insights'
import MyComplaints   from './pages/MyComplaints'
import AdminDashboard from './pages/AdminDashboard'
import Notifications  from './pages/Notifications'

function StudentPage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function AdminPage({ children }) {
  return (
    <AdminRoute>
      <Layout>{children}</Layout>
    </AdminRoute>
  )
}

function RoleRedirect() {
  const { user, userProfile } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (userProfile?.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Student routes */}
          <Route path="/dashboard"     element={<StudentPage><Dashboard /></StudentPage>} />
          <Route path="/submit"        element={<StudentPage><Submit /></StudentPage>} />
          <Route path="/insights"      element={<StudentPage><Insights /></StudentPage>} />
          <Route path="/my-complaints"  element={<StudentPage><MyComplaints /></StudentPage>} />
          <Route path="/notifications"  element={<StudentPage><Notifications /></StudentPage>} />

          {/* Admin routes */}
          <Route path="/admin"          element={<AdminPage><AdminDashboard /></AdminPage>} />
          <Route path="/admin/insights" element={<AdminPage><Insights /></AdminPage>} />

          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
