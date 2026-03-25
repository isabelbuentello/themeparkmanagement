import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEPARTMENT_ROUTES } from '../constants/roles'
import Emergency from '../components/Emergency'
import MaintenanceRequest from '../components/MaintenanceRequest'
import '../styles/employee-dash.css'

function EmployeeDash() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const [showEmergency, setShowEmergency] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="emp-dash-container">
      <h1 className="emp-header">Employee Dashboard</h1>
      <p className="emp-welcome">Welcome! You are logged in as: <strong>{role}</strong></p>

      <h2 className="emp-section-title">Shared Tools</h2>
      <div className="emp-tools-grid">
        <button className="emp-btn">View Park Map</button>
        <button className="emp-btn" onClick={() => { setShowMaintenance(!showMaintenance); setShowEmergency(false) }}>
          Submit Maintenance Request
        </button>
        <button className="emp-btn" onClick={() => { setShowEmergency(!showEmergency); setShowMaintenance(false) }}>
          Report Emergency
        </button>
        <button className="emp-btn">View Employee Directory</button>
      </div>

      {/* Forms Wrapper */}
      {(showMaintenance || showEmergency) && (
        <div className="emp-form-wrapper">
          {showMaintenance && <MaintenanceRequest onClose={() => setShowMaintenance(false)} />}
          {showEmergency && <Emergency onClose={() => setShowEmergency(false)} />}
        </div>
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