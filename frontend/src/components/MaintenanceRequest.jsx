import { useState, useEffect } from 'react'
import '../styles/shared-forms.css'

function MaintenanceRequest({ onClose }) {
  const [rides, setRides] = useState([])
  const [form, setForm] = useState({
    ride_id: '',
    issue_description: '',
    priority: 'medium'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/park/rides', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRides(data)
        }
      } catch (err) {
        console.error('Error fetching rides')
      }
    }
    fetchRides()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!form.ride_id || !form.issue_description) {
      setError('Please select a ride and describe the issue')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/park/maintenance-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message)
        return
      }

      setSuccess('Maintenance request submitted')
      setForm({ ride_id: '', issue_description: '', priority: 'medium' })
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <div className="shared-form-container">
      <h2>Submit Maintenance Request</h2>
      {error && <p className="msg-error">{error}</p>}
      {success && <p className="msg-success">{success}</p>}

      <div className="form-group">
        <label>Select Ride</label>
        <select className="form-control" name="ride_id" value={form.ride_id} onChange={handleChange}>
          <option value="">-- Choose a ride --</option>
          {rides.map(ride => (
            <option key={ride.ride_id} value={ride.ride_id}>{ride.ride_name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <textarea className="form-control" name="issue_description" placeholder="Describe the issue" value={form.issue_description} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Priority Level</label>
        <select className="form-control" name="priority" value={form.priority} onChange={handleChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button className="btn-primary" onClick={handleSubmit}>Submit Request</button>
      {onClose && <button className="btn-secondary" onClick={onClose}>Cancel</button>}
    </div>
  )
}

export default MaintenanceRequest