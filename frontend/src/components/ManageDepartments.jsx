import { useState, useEffect } from 'react'
import ConfirmActionModal from './ConfirmActionModal'
import '../styles/manage-departments.css'

function ManageDepartments({ token }) {
  const [departments, setDepartments] = useState([])
  const [rides, setRides] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [newDept, setNewDept] = useState({
    department_name: '',
    ride_id: '',
    venue_id: ''
  })

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setDepartments(await res.json())
    } catch (err) {
      console.error('Error fetching departments')
    } finally {
      setLoading(false)
    }
  }

  const fetchRides = async () => {
    try {
      const res = await fetch('/api/rides/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setRides(await res.json())
    } catch (err) {
      console.error('Error fetching rides')
    }
  }

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/venues', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setVenues(await res.json())
    } catch (err) {
      console.error('Error fetching venues')
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchRides()
    fetchVenues()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          department_name: newDept.department_name,
          ride_id: newDept.ride_id || null,
          venue_id: newDept.venue_id || null
        })
      })
      if (res.ok) {
        setShowForm(false)
        setNewDept({ department_name: '', ride_id: '', venue_id: '' })
        fetchDepartments()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create department')
      }
    } catch (err) {
      alert('Error creating department')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/departments/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setDepartments(departments.filter((d) => d.department_id !== deleteTarget.id))
        setDeleteTarget(null)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to delete department')
      }
    } catch (err) {
      alert('Error deleting department')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <div className="dept-panel">Loading departments...</div>

  return (
    <div className="dept-panel">
      <div className="dept-header">
        <h3>Department Management</h3>
        <button
          className={`dept-btn ${showForm ? 'dept-btn-cancel' : 'dept-btn-add'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Department'}
        </button>
      </div>

      {showForm && (
        <div className="dept-form-card">
          <h4>New Department</h4>
          <form onSubmit={handleCreate}>
            <div className="dept-form-group">
              <label className="dept-label">Department Name *</label>
              <input
                className="dept-input"
                value={newDept.department_name}
                onChange={e => setNewDept({ ...newDept, department_name: e.target.value })}
                placeholder="e.g. Roller Coaster Operations"
                required
              />
            </div>

            <div className="dept-form-row">
              <div className="dept-form-group">
                <label className="dept-label">Assigned Ride (optional)</label>
                <select
                  className="dept-select"
                  value={newDept.ride_id}
                  onChange={e => setNewDept({ ...newDept, ride_id: e.target.value })}
                >
                  <option value="">None</option>
                  {rides.map(r => (
                    <option key={r.ride_id} value={r.ride_id}>{r.ride_name}</option>
                  ))}
                </select>
              </div>

              <div className="dept-form-group">
                <label className="dept-label">Assigned Venue (optional)</label>
                <select
                  className="dept-select"
                  value={newDept.venue_id}
                  onChange={e => setNewDept({ ...newDept, venue_id: e.target.value })}
                >
                  <option value="">None</option>
                  {venues.map(v => (
                    <option key={v.venue_id} value={v.venue_id}>{v.venue_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="dept-btn dept-btn-submit">Create Department</button>
          </form>
        </div>
      )}

      <div className="dept-table-wrapper">
        <table className="dept-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Department Name</th>
              <th>Assigned Ride</th>
              <th>Assigned Venue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan="5" className="dept-empty">No departments yet. Add one above.</td>
              </tr>
            ) : (
              departments.map(dept => (
                <tr key={dept.department_id}>
                  <td>{dept.department_id}</td>
                  <td>{dept.department_name}</td>
                  <td>{dept.ride_name || '—'}</td>
                  <td>{dept.venue_name || '—'}</td>
                  <td>
                    <button
                      className="dept-btn dept-btn-delete"
                      onClick={() => setDeleteTarget({ id: dept.department_id, name: dept.department_name })}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmActionModal
        open={!!deleteTarget}
        title="Delete Department"
        message={deleteTarget ? `Are you sure you want to delete department "${deleteTarget.name}"?` : ''}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        isProcessing={isDeleting}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default ManageDepartments