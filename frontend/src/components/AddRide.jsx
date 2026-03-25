import { useState } from 'react'

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
    <div>
      <h3>Add New Ride</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <input name="ride_name" placeholder="Ride Name" value={form.ride_name} onChange={handleChange} />
      <select name="ride_type" value={form.ride_type} onChange={handleChange}>
        <option value="rollercoaster">Rollercoaster</option>
        <option value="water">Water</option>
        <option value="kids">Kids</option>
      </select>
      <label><input name="is_seasonal" type="checkbox" checked={form.is_seasonal} onChange={handleChange} /> Seasonal</label>
      <input name="size_sqft" type="number" placeholder="Size (sqft)" value={form.size_sqft} onChange={handleChange} />
      <input name="ride_lat" type="number" step="0.000001" placeholder="Latitude" value={form.ride_lat} onChange={handleChange} />
      <input name="ride_long" type="number" step="0.000001" placeholder="Longitude" value={form.ride_long} onChange={handleChange} />
      <input name="speed_mph" type="number" placeholder="Speed (mph)" value={form.speed_mph} onChange={handleChange} />
      <input name="min_height_ft" type="number" step="0.1" placeholder="Min Height (ft)" value={form.min_height_ft} onChange={handleChange} />
      <label><input name="affected_by_rain" type="checkbox" checked={form.affected_by_rain} onChange={handleChange} /> Affected by Rain</label>
      <select name="status_ride" value={form.status_ride} onChange={handleChange}>
        <option value="open">Open</option>
        <option value="broken">Broken</option>
        <option value="maintenance">Maintenance</option>
        <option value="closed_weather">Closed (Weather)</option>
      </select>
      <button onClick={handleSubmit}>Add Ride</button>
    </div>
  )
}

export default AddRide