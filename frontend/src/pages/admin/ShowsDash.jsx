import { useEffect, useState } from 'react'

const getLocalDateTimeInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const styles = {
  page: { padding: '32px 24px', maxWidth: '850px', margin: '0 auto', fontFamily: 'var(--body-font)', color: 'var(--ink)' },
  header: { fontSize: '2rem', fontFamily: 'var(--heading-font)', color: 'var(--ink)', marginBottom: '8px', fontWeight: 700 },
  subtitle: { color: 'var(--muted)', marginBottom: '24px', fontSize: '0.95rem' },
  alert: (type) => ({
    padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 500,
    background: type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
    color: type === 'success' ? '#166534' : '#b91c1c',
    border: `1px solid ${type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
  }),
  tabs: { display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '2px solid var(--border)', paddingBottom: '0' },
  tab: (active) => ({
    padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: '-2px',
    color: active ? 'var(--accent)' : 'var(--muted)', fontWeight: active ? 700 : 500, fontSize: '0.95rem',
    fontFamily: 'var(--body-font)', transition: 'all 0.2s'
  }),
  card: { background: 'var(--panel)', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--border)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px', marginTop: 0 },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px' },
  th: { padding: '10px 12px', textAlign: 'left', background: 'var(--ocean)', color: 'white', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.92rem', color: 'var(--ink)' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', width: '100%' },
  select: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', width: '100%' },
  btnPrimary: { padding: '11px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%', marginTop: '4px' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(15, 76, 129, 0.1)', color: 'var(--ocean)' }
}

function ShowsDash() {
  const [shows, setShows] = useState([])
  const [activeTab, setActiveTab] = useState('shows')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState({
    venue_name: '',
    hours: '',
    venue_lat: '0',
    venue_long: '0',
    show_category: 'musician',
    duration: ''
  })
  const [timeForm, setTimeForm] = useState({ show_id: '', show_start_time: '' })

  const token = localStorage.getItem('token')
  const minShowStartTime = getLocalDateTimeInputValue()

  const fetchShows = async () => {
    try {
      const res = await fetch('/api/park/shows', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Failed to load shows'); return }
      setShows(data)
    } catch {
      setError('Failed to load shows')
    }
  }

  useEffect(() => { fetchShows() }, [])

  const handleCreateShow = async () => {
    setMessage('')
    setError('')
    if (!showForm.venue_name || !showForm.hours || !showForm.duration) {
      setError('Please fill in all show fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/park/shows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...showForm,
          venue_lat: 0,
          venue_long: 0,
          duration: parseInt(showForm.duration)
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Unable to create show'); return }
      setMessage('Show created successfully.')
      setShowForm({ venue_name: '', hours: '', venue_lat: '0', venue_long: '0', show_category: 'musician', duration: '' })
      fetchShows()
      setActiveTab('shows')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleAddShowtime = async () => {
    setMessage('')
    setError('')
    if (!timeForm.show_id || !timeForm.show_start_time) { setError('Please select a show and start time'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/park/shows/${timeForm.show_id}/times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ show_start_time: timeForm.show_start_time })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Unable to add showtime'); return }
      setMessage('Showtime added successfully.')
      setTimeForm({ show_id: '', show_start_time: '' })
      fetchShows()
      setActiveTab('shows')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Shows Manager</h1>
      <p style={styles.subtitle}>Manage park shows and scheduled performances</p>

      {message && <div style={styles.alert('success')}>✅ {message}</div>}
      {error && <div style={styles.alert('error')}>⚠️ {error}</div>}

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'shows')} onClick={() => { setActiveTab('shows'); setMessage(''); setError('') }}>Current Shows</button>
        <button style={styles.tab(activeTab === 'create')} onClick={() => { setActiveTab('create'); setMessage(''); setError('') }}>Create Show</button>
        <button style={styles.tab(activeTab === 'schedule')} onClick={() => { setActiveTab('schedule'); setMessage(''); setError('') }}>Schedule Show</button>
      </div>

      {activeTab === 'shows' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>All Shows</h2>
          {shows.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No shows found.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, borderRadius: '8px 0 0 0' }}>Show</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Hours</th>
                  <th style={{ ...styles.th, borderRadius: '0 8px 0 0' }}>Scheduled Times</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((show, idx) => (
                  <tr key={show.show_id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(15,28,46,0.02)' }}>
                    <td style={styles.td}>{show.venue_name}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{show.show_category}</span>
                    </td>
                    <td style={styles.td}>{show.duration} min</td>
                    <td style={styles.td}>{show.hours}</td>
                    <td style={styles.td}>
                      {show.showtimes.length
                        ? show.showtimes.map((time) =>
                            new Date(time.show_start_time).toLocaleString([], {
                              month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit'
                            })
                          ).join(', ')
                        : <span style={{ color: 'var(--muted)' }}>No times scheduled</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Create Show</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Show Name</label>
            <input style={styles.input} type="text" placeholder="e.g. Sunset Spectacular" value={showForm.venue_name} onChange={(e) => setShowForm((c) => ({ ...c, venue_name: e.target.value }))} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Operating Hours</label>
            <input style={styles.input} type="text" placeholder="e.g. 2:00 PM and 7:00 PM" value={showForm.hours} onChange={(e) => setShowForm((c) => ({ ...c, hours: e.target.value }))} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Show Category</label>
            <select style={styles.select} value={showForm.show_category} onChange={(e) => setShowForm((c) => ({ ...c, show_category: e.target.value }))}>
              <option value="musician">Musician</option>
              <option value="magician">Magician</option>
              <option value="clown">Clown</option>
              <option value="puppets">Puppets</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Duration (minutes)</label>
            <input style={styles.input} type="number" min="1" max="120" placeholder="e.g. 45" value={showForm.duration} onChange={(e) => setShowForm((c) => ({ ...c, duration: e.target.value }))} />
          </div>

          <button style={styles.btnPrimary} onClick={handleCreateShow} disabled={loading}>
            {loading ? 'Creating...' : 'Create Show'}
          </button>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Schedule Show</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Select Show</label>
            <select style={styles.select} value={timeForm.show_id} onChange={(e) => setTimeForm((c) => ({ ...c, show_id: e.target.value }))}>
              <option value="">Select a show</option>
              {shows.map((show) => (
                <option key={show.show_id} value={show.show_id}>{show.venue_name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Show Start Time</label>
            <input style={styles.input} type="datetime-local" value={timeForm.show_start_time} min={minShowStartTime} onChange={(e) => setTimeForm((c) => ({ ...c, show_start_time: e.target.value }))} />
          </div>

          <button style={styles.btnPrimary} onClick={handleAddShowtime} disabled={loading}>
            {loading ? 'Scheduling...' : 'Add Showtime'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ShowsDash