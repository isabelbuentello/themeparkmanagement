import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token) return <Navigate to="/account" />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/account" />

  return children
}

export default ProtectedRoute