import { useState } from 'react'

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
    <div>
      <h2>Report Emergency</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <input name="date_of_emergency" type="date" value={form.date_of_emergency} onChange={handleChange} />
      <input name="event_lat" type="number" step="0.000001" placeholder="Latitude" value={form.event_lat} onChange={handleChange} />
      <input name="event_long" type="number" step="0.000001" placeholder="Longitude" value={form.event_long} onChange={handleChange} />
      <textarea name="event_description" placeholder="Describe the emergency" value={form.event_description} onChange={handleChange} />
      <button onClick={handleSubmit}>Submit Emergency</button>
      {onClose && <button onClick={onClose}>Cancel</button>}
    </div>
  )
}

export default Emergency