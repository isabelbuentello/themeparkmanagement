import { useState, useEffect } from 'react'
import '../styles/parkdaystats.css'


function ParkDayStats({ token }) {
  const todayDate = new Date().toISOString().split('T')[0]
  const [parkDays, setParkDays] = useState([])
  const [form, setForm] = useState({
    park_date: todayDate,
    rain: false,
    park_closed: false,
    weather_notes: ''
  })
  const [message, setMessage] = useState('')

  const fetchParkDays = async () => {
    try {
      const res = await fetch('/api/gm/parkday', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setParkDays(await res.json())
    } catch (err) { console.error('Error fetching park days') }
  }

  useEffect(() => { fetchParkDays() }, [])

  const handleSubmit = async () => {
    setMessage('')
    try {
      const res = await fetch('/api/gm/parkday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          park_date: form.park_date,
          rain: form.rain,
          park_closed: form.park_closed,
          weather_notes: form.weather_notes || null
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('Park day logged!')
        fetchParkDays()
      } else {
        setMessage(data.message || 'Error logging park day')
      }
    } catch (err) { setMessage('Error logging park day') }
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h3 className="gm-section-title">Log Park Day</h3>
      <div className="gm-form-card">
        <div className="gm-form-row">
          <label>Date</label>
          <input
            type="date"
            value={form.park_date}
            min={todayDate}
            onChange={e => setForm({ ...form, park_date: e.target.value })}
          />
        </div>
        <div className="gm-form-row">
          <label className="gm-checkbox-label">
            <input type="checkbox" checked={form.rain} onChange={e => setForm({ ...form, rain: e.target.checked })} />
            Rain
          </label>
          <label className="gm-checkbox-label">
            <input type="checkbox" checked={form.park_closed} onChange={e => setForm({ ...form, park_closed: e.target.checked })} />
            Park Closed
          </label>
        </div>
        <div className="gm-form-row">
          <label>Weather Notes</label>
          <input type="text" placeholder="Optional notes..." value={form.weather_notes} onChange={e => setForm({ ...form, weather_notes: e.target.value })} />
        </div>
        <button className="gm-submit-btn" onClick={handleSubmit}>Log Park Day</button>
        {message && <p className="gm-form-message">{message}</p>}
      </div>

      <h3 className="gm-section-title">Park Day History</h3>
      <div className="gm-table-wrapper">
        <table className="gm-table">
          <thead>
            <tr>
              <th>Date</th><th>Attendance</th><th>Rain</th>
              <th>Closed</th><th>Weather Notes</th>
            </tr>
          </thead>
          <tbody>
            {parkDays.map(day => (
              <tr key={day.day_id}>
                <td>{new Date(day.park_date + 'T00:00:00').toLocaleDateString()}</td>
                <td>{day.total_attendance}</td>
                <td>
                  <span className={`gm-badge ${day.rain ? 'gm-badge-warn' : 'gm-badge-ok'}`}>
                    {day.rain ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <span className={`gm-badge ${day.park_closed ? 'gm-badge-danger' : 'gm-badge-ok'}`}>
                    {day.park_closed ? 'Closed' : 'Open'}
                  </span>
                </td>
                <td>{day.weather_notes || '—'}</td>
              </tr>
            ))}
            {parkDays.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>No park days logged yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ParkDayStats
