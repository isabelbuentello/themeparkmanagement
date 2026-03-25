import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEPARTMENT_ROUTES } from '../constants/roles'
import Emergency from '../components/Emergency'
import MaintenanceRequest from '../components/MaintenanceRequest'

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
    <div>
      <h1>Employee Dashboard</h1>
      <p>Welcome! You are logged in as: {role}</p>

      <h2>Shared Tools</h2>
      <button>View Park Map</button>
      <button onClick={() => { setShowMaintenance(!showMaintenance); setShowEmergency(false) }}>
        Submit Maintenance Request
      </button>
      <button onClick={() => { setShowEmergency(!showEmergency); setShowMaintenance(false) }}>
        Report Emergency
      </button>
      <button>View Employee Directory</button>

      {showMaintenance && <MaintenanceRequest onClose={() => setShowMaintenance(false)} />}
      {showEmergency && <Emergency onClose={() => setShowEmergency(false)} />}

      <h2>My Department</h2>
      <button onClick={() => navigate(DEPARTMENT_ROUTES[role])}>
        Go to My Dashboard
      </button>

      <button onClick={handleLogout} style={{ marginTop: '20px' }}>
        Logout
      </button>
    </div>
  )
}

export default EmployeeDash