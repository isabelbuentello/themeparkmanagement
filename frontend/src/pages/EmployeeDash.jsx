import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEPARTMENT_ROUTES } from '../constants/roles'
import Emergency from '../components/Emergency'
import MaintenanceRequest from '../components/MaintenanceRequest'
import EmployeeDirectory from '../components/EmployeeDirectory'
import ParkMap from '../components/ParkMap'
import '../styles/employee-dash.css'


function EmployeeDash() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const [showEmergency, setShowEmergency] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [showDirectory, setShowDirectory] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    navigate('/account')
  }

  return (
    <div className="emp-dash-container">
      <h1 className="emp-header">Employee Dashboard</h1>
      <p className="emp-welcome">Welcome! You are logged in as: <strong>{role}</strong></p>

      <h2 className="emp-section-title">Shared Tools</h2>
      <div className="emp-tools-grid">
        <button 
            className="emp-btn" 
            onClick={() => { 
                setShowMap(!showMap)
                setShowMaintenance(false)
                setShowEmergency(false)
                setShowDirectory(false)
            }}
            >
            View Park Map
        </button>

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

        {showMap && <ParkMap token={token} />}
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
