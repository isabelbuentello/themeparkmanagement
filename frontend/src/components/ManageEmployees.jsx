import { useState, useEffect } from 'react'
import EmployeeDirectory from './EmployeeDirectory'
import '../styles/manage-employees.css'

function ManageEmployees({ token }) {
  const [departments, setDepartments] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    role: 'ride_attendant_manager',
    pay_rate: '',
    start_date: '',
    department_id: '',
    employee_phone: '',
    employee_email: '',
    employee_address: '',
    gender: 'prefer_not_to_say',
    employee_birthdate: '',
    ssn: ''
  })

  const roles = [
    'general_manager', 'maintenance', 'ride_attendant_manager',
    'parking_lot_manager', 'ticket_seller', 'restaurant_manager',
    'shop_manager', 'shows_manager'
  ]

  const genders = ['male', 'female', 'non_binary', 'prefer_not_to_say']
  const todayDate = new Date().toISOString().split('T')[0]

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
    fetchDepartments()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()

    if (newEmployee.employee_birthdate && newEmployee.employee_birthdate > todayDate) {
      alert('Birthdate cannot be in the future')
      return
    }

    if (newEmployee.start_date && newEmployee.start_date < todayDate) {
      alert('Start date cannot be in the past')
      return
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEmployee)
      })
      if (res.ok) {
        setShowCreateForm(false)
        setNewEmployee({
          full_name: '', role: 'ride_attendant_manager', pay_rate: '',
          start_date: '', department_id: '', employee_phone: '',
          employee_email: '', employee_address: '', gender: 'prefer_not_to_say',
          employee_birthdate: '', ssn: ''
        })
        setRefreshKey(prev => prev + 1)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create employee')
      }
    } catch (err) {
      alert('Error creating employee')
    }
  }

  return (
    <div>
      <div className="emp-actions">
        <button
          className={`emp-btn ${showCreateForm ? 'emp-btn-cancel' : 'emp-btn-add'}`}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showCreateForm && (
        <div className="emp-form-card">
          <h4>New Employee</h4>
          <form onSubmit={handleCreate}>
            <div className="emp-form-grid">
              <div className="emp-form-group">
                <label className="emp-label">Full Name *</label>
                <input
                  className="emp-input"
                  value={newEmployee.full_name}
                  onChange={e => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="emp-form-group">
                <label className="emp-label">Role *</label>
                <select
                  className="emp-select"
                  value={newEmployee.role}
                  onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="emp-form-group">
                <label className="emp-label">Department *</label>
                <select
                  className="emp-select"
                  value={newEmployee.department_id}
                  onChange={e => setNewEmployee({ ...newEmployee, department_id: e.target.value })}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
              <div className="emp-form-group">
                <label className="emp-label">Pay Rate ($/hr) *</label>
                <input
                  className="emp-input"
                  type="number"
                  step="0.01"
                  min="7.51"
                  value={newEmployee.pay_rate}
                  onChange={e => setNewEmployee({ ...newEmployee, pay_rate: e.target.value })}
                  required
                />
              </div>
              <div className="emp-form-group">
                <label className="emp-label">Start Date *</label>
                <input
                  className="emp-input"
                  type="date"
                  min={todayDate}
                  value={newEmployee.start_date}
                  onChange={e => setNewEmployee({ ...newEmployee, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="emp-form-group">
                <label className="emp-label">Birthdate *</label>
                <input
                  className="emp-input"
                  type="date"
                  max={todayDate}
                  value={newEmployee.employee_birthdate}
                  onChange={e => setNewEmployee({ ...newEmployee, employee_birthdate: e.target.value })}
                  required
                />
              </div>
              <div className="emp-form-group">
                <label className="emp-label">Gender *</label>
                <select
                  className="emp-select"
                  value={newEmployee.gender}
                  onChange={e => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                >
                  {genders.map(g => (
                    <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="emp-form-group">
                <label className="emp-label">SSN (9 digits) *</label>
                <input
                  className="emp-input"
                  maxLength="9"
                  value={newEmployee.ssn}
                  onChange={e => setNewEmployee({ ...newEmployee, ssn: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div className="emp-form-group">
                <label className="emp-label">Phone *</label>
                <input
                  className="emp-input"
                  value={newEmployee.employee_phone}
                  onChange={e => setNewEmployee({ ...newEmployee, employee_phone: e.target.value })}
                  required
                />
              </div>
              <div className="emp-form-group">
                <label className="emp-label">Email *</label>
                <input
                  className="emp-input"
                  type="email"
                  value={newEmployee.employee_email}
                  onChange={e => setNewEmployee({ ...newEmployee, employee_email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="emp-form-group">
              <label className="emp-label">Address *</label>
              <input
                className="emp-input"
                value={newEmployee.employee_address}
                onChange={e => setNewEmployee({ ...newEmployee, employee_address: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="emp-btn emp-btn-submit">Create Employee</button>
          </form>
        </div>
      )}

      <EmployeeDirectory key={refreshKey} token={token} isManager={true} />
    </div>
  )
}

export default ManageEmployees
