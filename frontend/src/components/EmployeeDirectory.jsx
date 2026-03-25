import { useState, useEffect } from 'react'
import '../styles/employee-directory.css'

function EmployeeDirectory({ token, isManager = false }) {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  const [filters, setFilters] = useState({
    search: '',
    department: '',
    role: ''
  })

  const roles = [
    'general_manager', 'maintenance', 'ride_attendant_manager',
    'parking_lot_manager', 'ticket_seller', 'restaurant_manager',
    'shop_manager', 'shows_manager'
  ]

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setEmployees(await res.json())
    } catch (err) {
      console.error('Error fetching employees')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setDepartments(await res.json())
    } catch (err) {
      console.error('Error fetching departments')
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                          emp.employee_id.toString().includes(filters.search)
    const matchesDept = !filters.department || emp.department_id.toString() === filters.department
    const matchesRole = !filters.role || emp.role === filters.role

    return matchesSearch && matchesDept && matchesRole
  })

  const clearFilters = () => {
    setFilters({ search: '', department: '', role: '' })
  }

  if (loading) return <div className="dir-panel">Loading employees...</div>

  return (
    <div className="dir-panel">
      <div className="dir-header">
        <h3>{isManager ? 'Employee Management' : 'Employee Directory'}</h3>
        <span className="dir-count">{filteredEmployees.length} employees</span>
      </div>

      <div className="dir-filters">
        <div className="dir-filter-group">
          <label className="dir-label">Search</label>
          <input
            className="dir-input"
            type="text"
            placeholder="Name or ID..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="dir-filter-group">
          <label className="dir-label">Department</label>
          <select
            className="dir-select"
            value={filters.department}
            onChange={e => setFilters({ ...filters, department: e.target.value })}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
            ))}
          </select>
        </div>

        <div className="dir-filter-group">
          <label className="dir-label">Role</label>
          <select
            className="dir-select"
            value={filters.role}
            onChange={e => setFilters({ ...filters, role: e.target.value })}
          >
            <option value="">All Roles</option>
            {roles.map(r => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <button className="dir-btn dir-btn-clear" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      <div className="dir-table-wrapper">
        <table className="dir-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              {isManager && <th>Role</th>}
              {isManager && <th>Pay Rate</th>}
              {isManager && <th>Start Date</th>}
              {isManager && <th>Account</th>}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={isManager ? 7 : 3} className="dir-empty">
                  No employees found.
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr
                  key={emp.employee_id}
                  onClick={() => setSelectedEmployee(emp)}
                  className="dir-row-clickable"
                >
                  <td>{emp.employee_id}</td>
                  <td>{emp.full_name}</td>
                  <td>{emp.department_name || '—'}</td>
                  {isManager && <td>{emp.role.replace(/_/g, ' ')}</td>}
                  {isManager && <td>${parseFloat(emp.pay_rate).toFixed(2)}/hr</td>}
                  {isManager && <td>{new Date(emp.start_date).toLocaleDateString()}</td>}
                  {isManager && (
                    <td>
                      <span className={emp.account_id ? 'dir-status-active' : 'dir-status-none'}>
                        {emp.account_id ? '✓ Active' : '✗ None'}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          isManager={isManager}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  )
}

function EmployeeDetailModal({ employee, isManager, onClose }) {
  return (
    <div className="dir-modal-overlay" onClick={onClose}>
      <div className="dir-modal" onClick={e => e.stopPropagation()}>
        <div className="dir-modal-header">
          <h4>{employee.full_name}</h4>
          <button className="dir-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="dir-modal-content">
          <div className="dir-detail-row">
            <span className="dir-detail-label">Employee ID:</span>
            <span>{employee.employee_id}</span>
          </div>
          <div className="dir-detail-row">
            <span className="dir-detail-label">Department:</span>
            <span>{employee.department_name || '—'}</span>
          </div>
          <div className="dir-detail-row">
            <span className="dir-detail-label">Role:</span>
            <span>{employee.role.replace(/_/g, ' ')}</span>
          </div>

          {isManager && (
            <>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Email:</span>
                <span>{employee.employee_email}</span>
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Phone:</span>
                <span>{employee.employee_phone}</span>
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Address:</span>
                <span>{employee.employee_address}</span>
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Gender:</span>
                <span>{employee.gender.replace(/_/g, ' ')}</span>
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Birthdate:</span>
                <span>{new Date(employee.employee_birthdate).toLocaleDateString()}</span>
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Pay Rate:</span>
                <span>${parseFloat(employee.pay_rate).toFixed(2)}/hr</span>
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Start Date:</span>
                <span>{new Date(employee.start_date).toLocaleDateString()}</span>
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">SSN:</span>
                <span>***-**-{employee.ssn?.slice(-4) || '****'}</span>
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Account:</span>
                <span className={employee.account_id ? 'dir-status-active' : 'dir-status-none'}>
                  {employee.account_id ? `Active (${employee.username})` : 'None'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeDirectory