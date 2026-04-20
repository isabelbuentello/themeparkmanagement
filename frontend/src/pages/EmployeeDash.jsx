import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEPARTMENT_ROUTES } from '../constants/roles'
import Emergency from '../components/Emergency'
import MaintenanceRequest from '../components/MaintenanceRequest'
import EmployeeDirectory from '../components/EmployeeDirectory'
import '../styles/employee-dash.css'

function EmployeeDash() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const [showEmergency, setShowEmergency] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [showDirectory, setShowDirectory] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    navigate('/account')
  }

  const formatRole = (role) => {
    if (!role) return ''
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="emp-dash-container">
      <h1 className="emp-header">Employee Dashboard</h1>
      <p className="emp-welcome">Welcome! You are logged in as: <strong>{formatRole(role)}</strong></p>
      <h2 className="emp-section-title">Shared Tools</h2>
      <div className="emp-tools-grid">
        <button className="emp-btn" onClick={() => { setShowMaintenance(!showMaintenance); setShowEmergency(false); setShowDirectory(false) }}>
          Submit Maintenance Request
        </button>
        <button className="emp-btn" onClick={() => { setShowEmergency(!showEmergency); setShowMaintenance(false); setShowDirectory(false) }}>
          Report Emergency
        </button>
        <button className="emp-btn" onClick={() => { setShowDirectory(!showDirectory); setShowEmergency(false); setShowMaintenance(false) }}>
          View Employee Directory
        </button>
      </div>

      {showMaintenance && (
        <div className="emp-form-wrapper">
          <MaintenanceRequest onClose={() => setShowMaintenance(false)} />
        </div>
      )}
      {showEmergency && (
        <div className="emp-form-wrapper">
          <Emergency onClose={() => setShowEmergency(false)} />
        </div>
      )}
      {showDirectory && (
        <EmployeeDirectory token={token} isManager={false} />
      )}

      <h2 className="emp-section-title">My Department</h2>
      <button className="emp-btn-primary" onClick={() => navigate(DEPARTMENT_ROUTES[role])}>
        Go to My Dashboard
      </button>
      <div style={{ textAlign: 'right' }}>
        <button className="emp-btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default EmployeeDash