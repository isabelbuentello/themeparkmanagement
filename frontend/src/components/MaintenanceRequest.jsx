import { useState, useEffect } from 'react'
import '../styles/shared-forms.css'

function MaintenanceRequest({ onClose }) {
  const [rides, setRides] = useState([])
  const [venues, setVenues] = useState([])
  const [locationType, setLocationType] = useState('ride')

  const [form, setForm] = useState({
    ride_id: '',
    venue_id: '',
    issue_description: '',
    priority: 'medium'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')

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
        const res = await fetch('/api/venues/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) setVenues(await res.json())
      } catch (err) {
        console.error('Error fetching venues')
      }
    }

    fetchRides()
    fetchVenues()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLocationTypeChange = (e) => {
    setLocationType(e.target.value)
    setForm({ ...form, ride_id: '', venue_id: '' })
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (locationType === 'ride' && !form.ride_id) {
      setError('Please select a ride')
      return
    }
    if (locationType === 'venue' && !form.venue_id) {
      setError('Please select a venue')
      return
    }
    if (!form.issue_description) {
      setError('Please describe the issue')
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
        body: JSON.stringify({
          ride_id: locationType === 'ride' ? form.ride_id : null,
          venue_id: locationType === 'venue' ? form.venue_id : null,
          issue_description: form.issue_description,
          priority: form.priority
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message)
        return
      }

      setSuccess('Maintenance request submitted')
      setForm({ ride_id: '', venue_id: '', issue_description: '', priority: 'medium' })
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
        <label>Request Type</label>
        <select className="form-control" value={locationType} onChange={handleLocationTypeChange}>
          <option value="ride">Ride Maintenance</option>
          <option value="venue">Venue Maintenance</option>
        </select>
      </div>

      {locationType === 'ride' && (
        <div className="form-group">
          <label>Select Ride</label>
          <select className="form-control" name="ride_id" value={form.ride_id} onChange={handleChange}>
            <option value="">-- Choose a ride --</option>
            {rides.map(ride => (
              <option key={ride.ride_id} value={ride.ride_id}>{ride.ride_name}</option>
            ))}
          </select>
        </div>
      )}

      {locationType === 'venue' && (
        <div className="form-group">
          <label>Select Venue</label>
          <select className="form-control" name="venue_id" value={form.venue_id} onChange={handleChange}>
            <option value="">-- Choose a venue --</option>
            {venues.map(venue => (
              <option key={venue.venue_id} value={venue.venue_id}>
                {venue.venue_name} ({venue.venue_type})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Issue Description</label>
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