import { useState, useEffect } from 'react'
import ConfirmActionModal from './ConfirmActionModal'
import '../styles/employee-directory.css'

function EmployeeDirectory({ token, isManager = false }) {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')

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

  const handleEmployeeUpdated = (updatedEmployee) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employee_id === updatedEmployee.employee_id ? updatedEmployee : emp
      )
    )
    setSelectedEmployee(updatedEmployee)
    setActionError('')
    setActionMessage('Employee details updated')
  }

  const handleEmployeeDeleted = (employeeId) => {
    setEmployees((prev) => prev.filter((emp) => emp.employee_id !== employeeId))
    setSelectedEmployee(null)
    setActionError('')
    setActionMessage('Employee deleted')
  }

  if (loading) return <div className="dir-panel">Loading employees...</div>

  return (
    <div className="dir-panel">
      <div className="dir-header">
        <h3>{isManager ? 'Employee Management' : 'Employee Directory'}</h3>
        <span className="dir-count">{filteredEmployees.length} employees</span>
      </div>

      {actionError && <p className="dir-action-error">{actionError}</p>}
      {actionMessage && <p className="dir-action-message">{actionMessage}</p>}

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
          token={token}
          departments={departments}
          roles={roles}
          onEmployeeUpdated={handleEmployeeUpdated}
          onEmployeeDeleted={handleEmployeeDeleted}
          onError={(message) => {
            setActionMessage('')
            setActionError(message)
          }}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  )
}

function EmployeeDetailModal({
  employee,
  isManager,
  token,
  departments,
  roles,
  onEmployeeUpdated,
  onEmployeeDeleted,
  onError,
  onClose
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    full_name: employee.full_name,
    role: employee.role,
    pay_rate: employee.pay_rate,
    department_id: String(employee.department_id),
    employee_phone: employee.employee_phone,
    employee_email: employee.employee_email,
    employee_address: employee.employee_address
  })

  useEffect(() => {
    setIsEditing(false)
    setFormData({
      full_name: employee.full_name,
      role: employee.role,
      pay_rate: employee.pay_rate,
      department_id: String(employee.department_id),
      employee_phone: employee.employee_phone,
      employee_email: employee.employee_email,
      employee_address: employee.employee_address
    })
  }, [employee])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        pay_rate: Number(formData.pay_rate),
        department_id: Number(formData.department_id)
      }

      const res = await fetch('/api/employees/' + employee.employee_id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        onError(data.error || 'Failed to update employee')
        return
      }

      const selectedDepartment = departments.find(
        (department) => department.department_id === Number(formData.department_id)
      )

      onEmployeeUpdated({
        ...employee,
        ...payload,
        department_name: selectedDepartment?.department_name || employee.department_name
      })
      setIsEditing(false)
    } catch {
      onError('Error updating employee')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch('/api/employees/' + employee.employee_id, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (!res.ok) {
        onError(data.error || 'Failed to delete employee')
        return
      }

      onEmployeeDeleted(employee.employee_id)
    } catch {
      onError('Error deleting employee')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

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
            {isManager && isEditing ? (
              <select
                className="dir-select"
                value={formData.department_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, department_id: e.target.value }))}
              >
                {departments.map((department) => (
                  <option key={department.department_id} value={department.department_id}>
                    {department.department_name}
                  </option>
                ))}
              </select>
            ) : (
              <span>{employee.department_name || '—'}</span>
            )}
          </div>
          <div className="dir-detail-row">
            <span className="dir-detail-label">Role:</span>
            {isManager && isEditing ? (
              <select
                className="dir-select"
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                ))}
              </select>
            ) : (
              <span>{employee.role.replace(/_/g, ' ')}</span>
            )}
          </div>

          {isManager && (
            <>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Email:</span>
                {isEditing ? (
                  <input
                    className="dir-input"
                    type="email"
                    value={formData.employee_email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employee_email: e.target.value }))}
                  />
                ) : (
                  <span>{employee.employee_email}</span>
                )}
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Phone:</span>
                {isEditing ? (
                  <input
                    className="dir-input"
                    value={formData.employee_phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employee_phone: e.target.value }))}
                  />
                ) : (
                  <span>{employee.employee_phone}</span>
                )}
              </div>
              <div className="dir-detail-row">
                <span className="dir-detail-label">Address:</span>
                {isEditing ? (
                  <input
                    className="dir-input"
                    value={formData.employee_address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, employee_address: e.target.value }))}
                  />
                ) : (
                  <span>{employee.employee_address}</span>
                )}
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
                {isEditing ? (
                  <input
                    className="dir-input"
                    type="number"
                    min="7.51"
                    step="0.01"
                    value={formData.pay_rate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pay_rate: e.target.value }))}
                  />
                ) : (
                  <span>${parseFloat(employee.pay_rate).toFixed(2)}/hr</span>
                )}
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

          {isManager && (
            <div className="dir-modal-actions">
              {isEditing ? (
                <>
                  <button
                    className="dir-btn dir-btn-clear"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        full_name: employee.full_name,
                        role: employee.role,
                        pay_rate: employee.pay_rate,
                        department_id: String(employee.department_id),
                        employee_phone: employee.employee_phone,
                        employee_email: employee.employee_email,
                        employee_address: employee.employee_address
                      })
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button className="dir-btn dir-btn-save" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button className="dir-btn dir-btn-save" onClick={() => setIsEditing(true)}>
                  Edit Employee
                </button>
              )}
              <button
                className="dir-btn dir-btn-delete"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || isDeleting}
              >
                Delete Employee
              </button>
            </div>
          )}
        </div>

        <ConfirmActionModal
          open={showDeleteConfirm}
          title="Delete Employee"
          message={`Are you sure you want to delete employee "${employee.full_name}"?`}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          isProcessing={isDeleting}
          onCancel={() => {
            if (!isDeleting) setShowDeleteConfirm(false)
          }}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  )
}

export default EmployeeDirectory