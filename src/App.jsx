import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import Submit       from './pages/Submit'
import Insights     from './pages/Insights'
import MyComplaints from './pages/MyComplaints'

function PrivatePage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard"     element={<PrivatePage><Dashboard /></PrivatePage>} />
          <Route path="/submit"        element={<PrivatePage><Submit /></PrivatePage>} />
          <Route path="/insights"      element={<PrivatePage><Insights /></PrivatePage>} />
          <Route path="/my-complaints" element={<PrivatePage><MyComplaints /></PrivatePage>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
