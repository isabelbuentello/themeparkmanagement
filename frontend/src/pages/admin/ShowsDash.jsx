import { useEffect, useState } from 'react'

function ShowsDash() {
  const [shows, setShows] = useState([])
  const [activeTab, setActiveTab] = useState('shows')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState({
    venue_name: '',
    hours: '',
    venue_lat: '',
    venue_long: '',
    show_category: 'musician',
    duration: ''
  })
  const [timeForm, setTimeForm] = useState({
    show_id: '',
    show_start_time: ''
  })

  const token = localStorage.getItem('token')

  const fetchShows = async () => {
    try {
      const res = await fetch('/api/park/shows', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to load shows')
        return
      }

      setShows(data)
    } catch {
      setError('Failed to load shows')
    }
  }

  useEffect(() => {
    fetchShows()
  }, [])

  const handleCreateShow = async () => {
    setMessage('')
    setError('')

    if (
      !showForm.venue_name ||
      !showForm.hours ||
      !showForm.venue_lat ||
      !showForm.venue_long ||
      !showForm.duration
    ) {
      setError('Please fill in all show fields')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/park/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...showForm,
          venue_lat: parseFloat(showForm.venue_lat),
          venue_long: parseFloat(showForm.venue_long),
          duration: parseInt(showForm.duration)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Unable to create show')
        return
      }

      setMessage('Show created successfully.')
      setShowForm({
        venue_name: '',
        hours: '',
        venue_lat: '',
        venue_long: '',
        show_category: 'musician',
        duration: ''
      })
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

    if (!timeForm.show_id || !timeForm.show_start_time) {
      setError('Please select a show and start time')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/park/shows/${timeForm.show_id}/times`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          show_start_time: timeForm.show_start_time
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Unable to add showtime')
        return
      }

      setMessage('Showtime added successfully.')
      setTimeForm({
        show_id: '',
        show_start_time: ''
      })
      fetchShows()
      setActiveTab('shows')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    backgroundColor: activeTab === tab ? '#333' : '#eee',
    color: activeTab === tab ? 'white' : 'black',
    border: 'none',
    marginRight: '5px'
  })

  return (
    <div style={{ padding: '20px', maxWidth: '850px', margin: '0 auto' }}>
      <h1>Shows Manager Dashboard</h1>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '20px' }}>
        <button
          style={tabStyle('shows')}
          onClick={() => {
            setActiveTab('shows')
            setMessage('')
            setError('')
          }}
        >
          Current Shows
        </button>
        <button
          style={tabStyle('create')}
          onClick={() => {
            setActiveTab('create')
            setMessage('')
            setError('')
          }}
        >
          Create Show
        </button>
        <button
          style={tabStyle('schedule')}
          onClick={() => {
            setActiveTab('schedule')
            setMessage('')
            setError('')
          }}
        >
          Schedule Show
        </button>
      </div>

      {activeTab === 'shows' && (
        <>
          <h2>All Shows</h2>
          {shows.length === 0 ? (
            <p>No shows found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ backgroundColor: '#333', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Show</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Duration</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Hours</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Scheduled Times</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((show) => (
                  <tr key={show.show_id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px' }}>{show.venue_name}</td>
                    <td style={{ padding: '8px' }}>{show.show_category}</td>
                    <td style={{ padding: '8px' }}>{show.duration} min</td>
                    <td style={{ padding: '8px' }}>{show.hours}</td>
                    <td style={{ padding: '8px' }}>
                      {show.showtimes.length
                        ? show.showtimes
                            .map((time) =>
                              new Date(time.show_start_time).toLocaleString([], {
                                month: 'numeric',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })
                            )
                            .join(', ')
                        : 'No times scheduled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'create' && (
        <>
          <h2>Create Show</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label>Show Name</label>
            <input
              type="text"
              value={showForm.venue_name}
              onChange={(e) =>
                setShowForm((current) => ({ ...current, venue_name: e.target.value }))
              }
              placeholder="e.g. Sunset Spectacular"
            />

            <label>Operating Hours</label>
            <input
              type="text"
              value={showForm.hours}
              onChange={(e) =>
                setShowForm((current) => ({ ...current, hours: e.target.value }))
              }
              placeholder="e.g. 2:00 PM and 7:00 PM"
            />

            <label>Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={showForm.venue_lat}
              onChange={(e) =>
                setShowForm((current) => ({ ...current, venue_lat: e.target.value }))
              }
              placeholder="e.g. 29.760700"
            />

            <label>Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={showForm.venue_long}
              onChange={(e) =>
                setShowForm((current) => ({ ...current, venue_long: e.target.value }))
              }
              placeholder="e.g. -95.369400"
            />

            <label>Show Category</label>
            <select
              value={showForm.show_category}
              onChange={(e) =>
                setShowForm((current) => ({ ...current, show_category: e.target.value }))
              }
            >
              <option value="musician">Musician</option>
              <option value="magician">Magician</option>
              <option value="clown">Clown</option>
              <option value="puppets">Puppets</option>
            </select>

            <label>Duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="120"
              value={showForm.duration}
              onChange={(e) =>
                setShowForm((current) => ({ ...current, duration: e.target.value }))
              }
              placeholder="e.g. 45"
            />

            <button onClick={handleCreateShow} disabled={loading}>
              {loading ? 'Creating...' : 'Create Show'}
            </button>
          </div>
        </>
      )}

      {activeTab === 'schedule' && (
        <>
          <h2>Schedule Show</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label>Select Show</label>
            <select
              value={timeForm.show_id}
              onChange={(e) =>
                setTimeForm((current) => ({ ...current, show_id: e.target.value }))
              }
            >
              <option value="">Select a show</option>
              {shows.map((show) => (
                <option key={show.show_id} value={show.show_id}>
                  {show.venue_name}
                </option>
              ))}
            </select>

            <label>Show Start Time</label>
            <input
              type="datetime-local"
              value={timeForm.show_start_time}
              onChange={(e) =>
                setTimeForm((current) => ({
                  ...current,
                  show_start_time: e.target.value
                }))
              }
            />

            <button onClick={handleAddShowtime} disabled={loading}>
              {loading ? 'Scheduling...' : 'Add Showtime'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ShowsDash
