import { useState } from 'react'
import '../styles/gm-forms.css'

function AddRide({ onRideAdded }) {
  const [form, setForm] = useState({
    ride_name: '', ride_type: 'rollercoaster', is_seasonal: false,
    size_sqft: '', ride_lat: '', ride_long: '', speed_mph: '',
    min_height_ft: '', affected_by_rain: false, status_ride: 'open'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!form.ride_name || !form.size_sqft || !form.ride_lat ||
        !form.ride_long || !form.speed_mph || !form.min_height_ft) {
      setError('Please fill in all fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setSuccess('Ride added successfully')
      setForm({
        ride_name: '', ride_type: 'rollercoaster', is_seasonal: false,
        size_sqft: '', ride_lat: '', ride_long: '', speed_mph: '',
        min_height_ft: '', affected_by_rain: false, status_ride: 'open'
      })
      if (onRideAdded) onRideAdded()
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <div className="gm-panel">
      <h3>Add New Ride</h3>
      {error && <p style={{ color: '#dc3545', fontWeight: 'bold' }}>{error}</p>}
      {success && <p style={{ color: '#28a745', fontWeight: 'bold' }}>{success}</p>}
      
      <div className="gm-form-grid">
        <div>
          <label className="gm-label">Ride Name</label>
          <input className="gm-input" name="ride_name" placeholder="e.g., The Goliath" value={form.ride_name} onChange={handleChange} />
        </div>
        
        <div>
          <label className="gm-label">Ride Type</label>
          <select className="gm-select" name="ride_type" value={form.ride_type} onChange={handleChange}>
            <option value="rollercoaster">Rollercoaster</option>
            <option value="water">Water</option>
            <option value="kids">Kids</option>
          </select>
        </div>

        <div>
          <label className="gm-label">Size (sqft)</label>
          <input className="gm-input" name="size_sqft" type="number" value={form.size_sqft} onChange={handleChange} />
        </div>

        <div>
          <label className="gm-label">Speed (mph)</label>
          <input className="gm-input" name="speed_mph" type="number" value={form.speed_mph} onChange={handleChange} />
        </div>

        <div>
          <label className="gm-label">Latitude</label>
          <input className="gm-input" name="ride_lat" type="number" step="0.000001" value={form.ride_lat} onChange={handleChange} />
        </div>

        <div>
          <label className="gm-label">Longitude</label>
          <input className="gm-input" name="ride_long" type="number" step="0.000001" value={form.ride_long} onChange={handleChange} />
        </div>

        <div>
          <label className="gm-label">Min Height (ft)</label>
          <input className="gm-input" name="min_height_ft" type="number" step="0.1" value={form.min_height_ft} onChange={handleChange} />
        </div>

        <div>
          <label className="gm-label">Initial Status</label>
          <select className="gm-select" name="status_ride" value={form.status_ride} onChange={handleChange}>
            <option value="open">Open</option>
            <option value="broken">Broken</option>
            <option value="maintenance">Maintenance</option>
            <option value="closed_weather">Closed (Weather)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <label className="gm-checkbox-group">
          <input name="is_seasonal" type="checkbox" checked={form.is_seasonal} onChange={handleChange} />
          Seasonal Ride
        </label>
        
        <label className="gm-checkbox-group">
          <input name="affected_by_rain" type="checkbox" checked={form.affected_by_rain} onChange={handleChange} />
          Affected by Rain
        </label>
      </div>

      <button className="gm-btn" onClick={handleSubmit}>Add Ride to Database</button>
    </div>
  )
}

export default AddRide