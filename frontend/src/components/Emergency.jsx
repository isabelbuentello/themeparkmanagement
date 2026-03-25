import { useState, useEffect } from 'react'
import '../styles/shared-forms.css'

function Emergency({ onClose }) {
  const [venues, setVenues] = useState([])
  const [rides, setRides] = useState([])
  const [locationType, setLocationType] = useState('manual')

  const [form, setForm] = useState({
    date_of_emergency: new Date().toISOString().split('T')[0],
    event_lat: '',
    event_long: '',
    event_description: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')

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

    fetchVenues()
    fetchRides()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleLocationTypeChange = (e) => {
    setLocationType(e.target.value)
    setForm({ ...form, event_lat: '', event_long: '' })
  }

  const handleVenueSelect = (e) => {
    const venueId = e.target.value
    if (!venueId) {
      setForm({ ...form, event_lat: '', event_long: '' })
      return
    }
    const venue = venues.find(v => v.venue_id.toString() === venueId)
    if (venue) {
      setForm({ ...form, event_lat: venue.venue_lat, event_long: venue.venue_long })
    }
  }

  const handleRideSelect = (e) => {
    const rideId = e.target.value
    if (!rideId) {
      setForm({ ...form, event_lat: '', event_long: '' })
      return
    }
    const ride = rides.find(r => r.ride_id.toString() === rideId)
    if (ride) {
      setForm({ ...form, event_lat: ride.ride_lat, event_long: ride.ride_long })
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!form.date_of_emergency || !form.event_lat || !form.event_long || !form.event_description) {
      setError('Please fill in all fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/park/emergency', {
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

      setSuccess('Emergency reported successfully')
      setForm({ date_of_emergency: new Date().toISOString().split('T')[0], event_lat: '', event_long: '', event_description: '' })
      setLocationType('manual')
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <div className="shared-form-container">
      <h2>Report Emergency</h2>
      {error && <p className="msg-error">{error}</p>}
      {success && <p className="msg-success">{success}</p>}
      
      <div className="form-group">
        <label>Date of Emergency</label>
        <input className="form-control" name="date_of_emergency" type="date" value={form.date_of_emergency} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Location Type</label>
        <select className="form-control" value={locationType} onChange={handleLocationTypeChange}>
          <option value="manual">Enter Coordinates Manually</option>
          <option value="venue">Select a Venue</option>
          <option value="ride">Select a Ride</option>
        </select>
      </div>

      {locationType === 'venue' && (
        <div className="form-group">
          <label>Select Venue</label>
          <select className="form-control" onChange={handleVenueSelect}>
            <option value="">-- Choose a venue --</option>
            {venues.map(venue => (
              <option key={venue.venue_id} value={venue.venue_id}>
                {venue.venue_name} ({venue.venue_type})
              </option>
            ))}
          </select>
        </div>
      )}

      {locationType === 'ride' && (
        <div className="form-group">
          <label>Select Ride</label>
          <select className="form-control" onChange={handleRideSelect}>
            <option value="">-- Choose a ride --</option>
            {rides.map(ride => (
              <option key={ride.ride_id} value={ride.ride_id}>
                {ride.ride_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Latitude</label>
          <input 
            className="form-control" 
            name="event_lat" 
            type="number" 
            step="0.000001" 
            placeholder="Latitude" 
            value={form.event_lat} 
            onChange={handleChange}
            readOnly={locationType !== 'manual'}
          />
        </div>

        <div className="form-group">
          <label>Longitude</label>
          <input 
            className="form-control" 
            name="event_long" 
            type="number" 
            step="0.000001" 
            placeholder="Longitude" 
            value={form.event_long} 
            onChange={handleChange}
            readOnly={locationType !== 'manual'}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea className="form-control" name="event_description" placeholder="Describe the emergency" value={form.event_description} onChange={handleChange} />
      </div>

      <button className="btn-primary" onClick={handleSubmit}>Submit Emergency</button>
      {onClose && <button className="btn-secondary" onClick={onClose}>Cancel</button>}
    </div>
  )
}

export default Emergency