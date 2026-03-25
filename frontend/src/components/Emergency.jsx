import { useState } from 'react'
import '../styles/shared-forms.css'

function Emergency({ onClose }) {
  const [form, setForm] = useState({
    date_of_emergency: new Date().toISOString().split('T')[0],
    event_lat: '',
    event_long: '',
    event_description: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
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
        <input className="form-control" name="event_lat" type="number" step="0.000001" placeholder="Latitude" value={form.event_lat} onChange={handleChange} />
      </div>

      <div className="form-group">
        <input className="form-control" name="event_long" type="number" step="0.000001" placeholder="Longitude" value={form.event_long} onChange={handleChange} />
      </div>

      <div className="form-group">
        <textarea className="form-control" name="event_description" placeholder="Describe the emergency" value={form.event_description} onChange={handleChange} />
      </div>

      <button className="btn-primary" onClick={handleSubmit}>Submit Emergency</button>
      {onClose && <button className="btn-secondary" onClick={onClose}>Cancel</button>}
    </div>
  )
}

export default Emergency