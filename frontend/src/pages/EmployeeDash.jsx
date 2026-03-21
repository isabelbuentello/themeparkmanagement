import { useNavigate } from 'react-router-dom'
import { ROLE_ROUTES } from '../constants/roles'
import { DEPARTMENT_ROUTES } from '../constants/roles'

function EmployeeDash() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')

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
      <button>Submit Maintenance Request</button>
      <button>Report Emergency</button>
      <button>View Employee Directory</button>

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