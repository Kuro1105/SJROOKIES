import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminRoute({ children }) {
  const { user, userProfile } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (userProfile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
