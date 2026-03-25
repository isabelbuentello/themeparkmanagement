import { useState, useEffect } from 'react'

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
    <div>
      <h2>Submit Maintenance Request</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <select name="ride_id" value={form.ride_id} onChange={handleChange}>
        <option value="">Select a ride</option>
        {rides.map(ride => (
          <option key={ride.ride_id} value={ride.ride_id}>{ride.ride_name}</option>
        ))}
      </select>

      <textarea name="issue_description" placeholder="Describe the issue" value={form.issue_description} onChange={handleChange} />

      <select name="priority" value={form.priority} onChange={handleChange}>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <button onClick={handleSubmit}>Submit Request</button>
      {onClose && <button onClick={onClose}>Cancel</button>}
    </div>
  )
}

export default MaintenanceRequest