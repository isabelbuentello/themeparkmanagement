import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/gm-dash.css'

const STATUS_OPTIONS = ['open', 'broken', 'maintenance']

function RideAttendantDash() {
  const navigate = useNavigate()
  const [rides, setRides] = useState([])
  const [queueOverview, setQueueOverview] = useState([])
  const [rainouts, setRainouts] = useState([])
  const [selectedRideName, setSelectedRideName] = useState('')
  const [reservations, setReservations] = useState([])
  const [pendingStatus, setPendingStatus] = useState({})
  const [originalStatus, setOriginalStatus] = useState({})
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [isSavingFocus, setIsSavingFocus] = useState(false)
  const [rideError, setRideError] = useState('')
  const [rideMessage, setRideMessage] = useState('')
  const [queueError, setQueueError] = useState('')
  const [queueMessage, setQueueMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [rideTypeFilter, setRideTypeFilter] = useState('all')
  const [rideSort, setRideSort] = useState('alpha_asc')
  const [queueRideFilter, setQueueRideFilter] = useState('all')
  const [rainoutRideFilter, setRainoutRideFilter] = useState('all')
  const [focusRideId, setFocusRideId] = useState('')

  const token = localStorage.getItem('token')

  const buildUrlWithParams = (basePath, params) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        searchParams.set(key, value)
      }
    })

    const queryText = searchParams.toString()
    return queryText ? `${basePath}?${queryText}` : basePath
  }

  const loadDashboard = async () => {
    setRideError('')
    setQueueError('')
    try {
      const [ridesRes, queueRes, rainoutsRes] = await Promise.all([
        fetch(
          buildUrlWithParams('/api/rides', {
            status: statusFilter,
            rideType: rideTypeFilter,
            sort: rideSort
          }),
          {
          headers: { Authorization: 'Bearer ' + token }
          }
        ),
        fetch(buildUrlWithParams('/api/rides/queue-overview', { rideId: queueRideFilter }), {
          headers: { Authorization: 'Bearer ' + token }
        }),
        fetch(buildUrlWithParams('/api/rides/rainouts', { rideId: rainoutRideFilter }), {
          headers: { Authorization: 'Bearer ' + token }
        })
      ])

      const ridesData = await ridesRes.json()
      const queueData = await queueRes.json()
      const rainoutData = await rainoutsRes.json()

      if (!ridesRes.ok) {
        setRideError(ridesData.message || 'Failed to load rides')
        return
      }

      if (!queueRes.ok) {
        setQueueError(queueData.message || 'Failed to load queue overview')
        return
      }

      if (!rainoutsRes.ok) {
        setQueueError(rainoutData.message || 'Failed to load rainout history')
        return
      }

      setRides(ridesData)
      setQueueOverview(queueData)
      setRainouts(rainoutData)

      const defaults = {}
      ridesData.forEach((ride) => {
        defaults[ride.ride_id] = ride.status_ride
      })
      setPendingStatus(defaults)
      setOriginalStatus(defaults)
    } catch {
      setRideError('Failed to connect to backend')
      setQueueError('Failed to connect to backend')
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [statusFilter, rideTypeFilter, rideSort, queueRideFilter, rainoutRideFilter])

  useEffect(() => {
    if (rides.length > 0 && (!focusRideId || !rides.some((ride) => String(ride.ride_id) === focusRideId))) {
      setFocusRideId(String(rides[0].ride_id))
    }
  }, [focusRideId, rides])

  const statusCounts = rides.reduce((counts, ride) => {
    counts[ride.status_ride] = (counts[ride.status_ride] || 0) + 1
    return counts
  }, {})

  const rideTypeOptions = [...new Set(rides.map((ride) => ride.ride_type).filter(Boolean))]

  const queueByRideId = queueOverview.reduce((map, queue) => {
    map[queue.ride_id] = queue
    return map
  }, {})

  const now = Date.now()
  const rainoutsLast24h = rainouts.filter((rainout) => {
    const loggedAt = new Date(rainout.rainout_time).getTime()
    return Number.isFinite(loggedAt) && now - loggedAt <= 24 * 60 * 60 * 1000
  }).length

  const pendingReservationsTotal = queueOverview.reduce(
    (total, queue) => total + Number(queue.pending_reservations || 0),
    0
  )

  const attentionRides = rides.filter(
    (ride) => ride.status_ride === 'broken' || ride.status_ride === 'maintenance' || ride.status_ride === 'closed_weather'
  )

  const focusRide = rides.find((ride) => String(ride.ride_id) === focusRideId) || null
  const focusQueue = focusRide ? queueByRideId[focusRide.ride_id] : null
  const focusLatestRainout = focusRide
    ? rainouts
        .filter((rainout) => rainout.ride_id === focusRide.ride_id)
        .sort((a, b) => new Date(b.rainout_time) - new Date(a.rainout_time))[0]
    : null
  const focusHasDraftChange = focusRide
    ? pendingStatus[focusRide.ride_id] && pendingStatus[focusRide.ride_id] !== originalStatus[focusRide.ride_id]
    : false

  const statusChipStyle = (status) => {
    if (status === 'broken') {
      return {
        background: 'rgba(220, 38, 38, 0.15)',
        color: '#b91c1c'
      }
    }

    if (status === 'maintenance') {
      return {
        background: 'rgba(245, 158, 11, 0.16)',
        color: '#b45309'
      }
    }

    if (status === 'closed_weather') {
      return {
        background: 'rgba(37, 99, 235, 0.15)',
        color: '#1d4ed8'
      }
    }

    return {
      background: 'rgba(34, 197, 94, 0.15)',
      color: '#166534'
    }
  }

  const statusLabel = (status) => {
    if (status === 'closed_weather') return 'closed weather'
    return status
  }

  const saveAllStatuses = async () => {
    setRideMessage('')
    setRideError('')

    const changedRides = rides.filter(
      (ride) => pendingStatus[ride.ride_id] !== originalStatus[ride.ride_id]
    )

    if (changedRides.length === 0) {
      setRideMessage('No status changes to save')
      return
    }

    setIsSavingAll(true)

    try {
      const results = await Promise.all(
        changedRides.map(async (ride) => {
          const res = await fetch('/api/rides/' + ride.ride_id + '/status', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + token
            },
            body: JSON.stringify({ status_ride: pendingStatus[ride.ride_id] })
          })

          const data = await res.json()
          return {
            ok: res.ok,
            rideName: ride.ride_name,
            message: data.message || 'Failed to update status'
          }
        })
      )

      const failed = results.filter((result) => !result.ok)
      if (failed.length > 0) {
        setRideError('Failed to save ' + failed.length + ' ride(s): ' + failed.map((r) => r.rideName).join(', '))
      }

      const successCount = results.length - failed.length
      if (successCount > 0) {
        setRideMessage('Saved status for ' + successCount + ' ride(s)')
      }

      await loadDashboard()
    } catch {
      setRideError('Failed to connect to backend')
    } finally {
      setIsSavingAll(false)
    }
  }

  const saveFocusStatus = async () => {
    if (!focusRide) {
      setRideError('Select a ride to save')
      return
    }

    const nextStatus = pendingStatus[focusRide.ride_id] || focusRide.status_ride
    if (nextStatus === originalStatus[focusRide.ride_id]) {
      setRideMessage('No changes to save for selected ride')
      return
    }

    setRideMessage('')
    setRideError('')
    setIsSavingFocus(true)

    try {
      const res = await fetch('/api/rides/' + focusRide.ride_id + '/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ status_ride: nextStatus })
      })

      const data = await res.json()
      if (!res.ok) {
        setRideError(data.message || 'Failed to save selected ride')
        return
      }

      setRideMessage('Saved status for ' + focusRide.ride_name)
      await loadDashboard()
    } catch {
      setRideError('Failed to connect to backend')
    } finally {
      setIsSavingFocus(false)
    }
  }

  const logRainout = async (rideId) => {
    setRideMessage('')
    setRideError('')
    try {
      const res = await fetch('/api/rides/' + rideId + '/rainout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      })

      const data = await res.json()
      if (!res.ok) {
        setRideError(data.message || 'Failed to log rainout')
        return
      }

      setRideMessage('Rainout logged')
      loadDashboard()
    } catch {
      setRideError('Failed to connect to backend')
    }
  }

  const viewReservations = async (rideId, rideName) => {
    setQueueError('')
    setQueueMessage('')
    try {
      const res = await fetch('/api/rides/' + rideId + '/reservations', {
        headers: { Authorization: 'Bearer ' + token }
      })

      const data = await res.json()
      if (!res.ok) {
        setQueueError(data.message || 'Failed to load reservations')
        return
      }

      setSelectedRideName(rideName)
      setReservations(data)
      setQueueMessage('Reservations loaded for ' + rideName)
    } catch {
      setQueueError('Failed to connect to backend')
    }
  }

  return (
    <div className="gm-dash-container">
      <div className="gm-header-bar">
        <h1>Ride Attendant Manager Dashboard</h1>
        <button className="gm-btn-back" onClick={() => navigate('/account/employee')}>Back to Employee Dashboard</button>
      </div>
      {rideError && <p style={{ color: 'red' }}>{rideError}</p>}
      {rideMessage && <p style={{ color: 'green' }}>{rideMessage}</p>}

      <h2 className="gm-section-title">Operations Snapshot</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        {[
          { label: 'Total rides', value: rides.length, tint: 'rgba(15, 118, 110, 0.12)', tone: '#0f766e' },
          { label: 'Open rides', value: statusCounts.open || 0, tint: 'rgba(34, 197, 94, 0.12)', tone: '#15803d' },
          { label: 'Need attention', value: attentionRides.length, tint: 'rgba(220, 38, 38, 0.12)', tone: '#b91c1c' },
          { label: 'Pending reservations', value: pendingReservationsTotal, tint: 'rgba(234, 88, 12, 0.12)', tone: '#c2410c' },
          { label: 'Rainouts (24h)', value: rainoutsLast24h, tint: 'rgba(37, 99, 235, 0.12)', tone: '#1d4ed8' }
        ].map((item) => (
          <article
            key={item.label}
            style={{
              borderRadius: 14,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.97), rgba(248,250,252,0.94))',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
              padding: '14px 14px 12px'
            }}
          >
            <div
              style={{
                display: 'inline-block',
                padding: '3px 9px',
                borderRadius: 999,
                background: item.tint,
                color: item.tone,
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: '2rem',
                lineHeight: 1.1,
                fontWeight: 800,
                color: '#0f172a'
              }}
            >
              {item.value}
            </div>
          </article>
        ))}
      </div>

      <h2 className="gm-section-title">Action Center</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}
      >
        <article
          style={{
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.24)',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
            padding: '14px 16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Rides Needing Attention</h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 34,
                height: 28,
                padding: '0 8px',
                borderRadius: 999,
                background: 'rgba(220, 38, 38, 0.12)',
                color: '#b91c1c',
                fontWeight: 800,
                fontSize: '0.9rem'
              }}
            >
              {attentionRides.length}
            </span>
          </div>
          {attentionRides.length === 0 && <p style={{ marginBottom: 0, color: '#334155' }}>All rides currently open.</p>}
          <div style={{ display: 'grid', gap: 8 }}>
            {attentionRides.slice(0, 6).map((ride) => (
              <div
                key={ride.ride_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: 'rgba(241, 245, 249, 0.8)',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                }}
              >
                <strong style={{ color: '#0f172a' }}>{ride.ride_name}</strong>
                <span
                  style={{
                    ...statusChipStyle(ride.status_ride),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 118,
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {statusLabel(ride.status_ride)}
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <h2 className="gm-section-title">Ride Focus</h2>
      <div
        style={{
          borderRadius: 16,
          border: '1px solid rgba(148, 163, 184, 0.24)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.94))',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
          padding: '14px 16px',
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label htmlFor="focus-ride-select" style={{ fontWeight: 700, color: '#0f172a' }}>Ride</label>
          <select
            id="focus-ride-select"
            value={focusRideId}
            onChange={(e) => setFocusRideId(e.target.value)}
          >
            {rides.map((ride) => (
              <option key={ride.ride_id} value={ride.ride_id}>
                {ride.ride_name}
              </option>
            ))}
          </select>
          {focusRide && (
            <>
              <button
                onClick={() =>
                  setPendingStatus((prev) => ({
                    ...prev,
                    [focusRide.ride_id]: 'open'
                  }))
                }
                style={{ background: '#166534', color: '#fff' }}
              >
                Mark Open
              </button>
              <button
                onClick={() =>
                  setPendingStatus((prev) => ({
                    ...prev,
                    [focusRide.ride_id]: 'maintenance'
                  }))
                }
                style={{ background: '#b45309', color: '#fff' }}
              >
                Mark Maintenance
              </button>
              <button
                onClick={() =>
                  setPendingStatus((prev) => ({
                    ...prev,
                    [focusRide.ride_id]: 'broken'
                  }))
                }
                style={{ background: '#b91c1c', color: '#fff' }}
              >
                Mark Broken
              </button>
              <button
                onClick={saveFocusStatus}
                disabled={!focusHasDraftChange || isSavingFocus}
                style={{ background: '#1d4ed8', color: '#fff' }}
              >
                {isSavingFocus ? 'Saving Focus...' : 'Save Ride Focus Change'}
              </button>
            </>
          )}
        </div>
        {focusRide && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 128,
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                ...statusChipStyle(focusRide.status_ride)
              }}
            >
              {statusLabel(focusRide.status_ride)}
            </div>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginTop: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(241, 245, 249, 0.85)' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Ride Type</div>
                <div style={{ marginTop: 2, fontWeight: 700, color: '#0f172a' }}>{focusRide.ride_type || 'n/a'}</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(241, 245, 249, 0.85)' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Pending Queue</div>
                <div style={{ marginTop: 2, fontWeight: 700, color: '#0f172a' }}>{focusQueue?.pending_reservations || 0}</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(241, 245, 249, 0.85)' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Queue</div>
                <div style={{ marginTop: 2, fontWeight: 700, color: '#0f172a' }}>{focusQueue?.total_reservations || 0}</div>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(241, 245, 249, 0.85)' }}>
                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Unsaved Change</div>
                <div style={{ marginTop: 2, fontWeight: 700, color: focusHasDraftChange ? '#b91c1c' : '#0f172a' }}>
                  {focusHasDraftChange ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: '#334155' }}>Latest rainout:</span>{' '}
              <span style={{ color: '#0f172a' }}>
                {focusLatestRainout ? new Date(focusLatestRainout.rainout_time).toLocaleString() : 'none'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All ride statuses</option>
          <option value="open">open</option>
          <option value="broken">broken</option>
          <option value="maintenance">maintenance</option>
          <option value="closed_weather">closed_weather</option>
        </select>
        <select value={rideTypeFilter} onChange={(e) => setRideTypeFilter(e.target.value)}>
          <option value="all">All ride types</option>
          {rideTypeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select value={rideSort} onChange={(e) => setRideSort(e.target.value)}>
          <option value="alpha_asc">A-Z</option>
          <option value="alpha_desc">Z-A</option>
          <option value="default">Default order</option>
        </select>
      </div>

      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Open</th>
            <th>Broken</th>
            <th>Maintenance</th>
            <th>Closed Weather</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{statusCounts.open || 0}</td>
            <td>{statusCounts.broken || 0}</td>
            <td>{statusCounts.maintenance || 0}</td>
            <td>{statusCounts.closed_weather || 0}</td>
          </tr>
        </tbody>
      </table>
      </div>

      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Ride</th>
            <th>Current Status</th>
            <th>Set Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rides.map((ride) => (
            <tr key={ride.ride_id}>
              <td>{ride.ride_name}</td>
              <td>{ride.status_ride}</td>
              <td>
                <select
                  value={pendingStatus[ride.ride_id] || ride.status_ride}
                  onChange={(e) =>
                    setPendingStatus((prev) => ({
                      ...prev,
                      [ride.ride_id]: e.target.value
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button onClick={() => logRainout(ride.ride_id)} style={{ marginLeft: 8 }}>
                  Log Rainout
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <button onClick={saveAllStatuses} disabled={isSavingAll} style={{ marginTop: 12 }}>
        {isSavingAll ? 'Saving...' : 'Save All Statuses'}
      </button>

      <h2 className="gm-section-title">Queue Overview</h2>
      {queueError && <p style={{ color: 'red' }}>{queueError}</p>}
      {queueMessage && <p style={{ color: 'green' }}>{queueMessage}</p>}
      <div style={{ marginBottom: 10 }}>
        <select value={queueRideFilter} onChange={(e) => setQueueRideFilter(e.target.value)}>
          <option value="all">All rides</option>
          {rides.map((ride) => (
            <option key={ride.ride_id} value={ride.ride_id}>
              {ride.ride_name}
            </option>
          ))}
        </select>
      </div>
      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Ride</th>
            <th>Total</th>
            <th>Pending</th>
            <th>Fulfilled</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {queueOverview.map((queue) => (
            <tr key={queue.ride_id}>
              <td>{queue.ride_name}</td>
              <td>{queue.total_reservations ?? 0}</td>
              <td>{queue.pending_reservations ?? 0}</td>
              <td>{queue.fulfilled_reservations ?? 0}</td>
              <td>
                <button onClick={() => viewReservations(queue.ride_id, queue.ride_name)}>
                  View Reservations
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h2 className="gm-section-title">Reservations {selectedRideName ? ' - ' + selectedRideName : ''}</h2>
      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Reservation ID</th>
            <th>Customer ID</th>
            <th>Reservation Time</th>
            <th>Fulfilled</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.reservation_id}>
              <td>{reservation.reservation_id}</td>
              <td>{reservation.customer_id}</td>
              <td>{new Date(reservation.reservation_time).toLocaleString()}</td>
              <td>{reservation.reservation_fulfilled ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h2 className="gm-section-title">Rainout History</h2>
      <div style={{ marginBottom: 10 }}>
        <select value={rainoutRideFilter} onChange={(e) => setRainoutRideFilter(e.target.value)}>
          <option value="all">All rides</option>
          {rides.map((ride) => (
            <option key={ride.ride_id} value={ride.ride_id}>
              {ride.ride_name}
            </option>
          ))}
        </select>
      </div>
      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Ride</th>
            <th>Rainout Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rainouts.map((rainout) => (
            <tr key={rainout.rainout_id}>
              <td>{rainout.ride_name}</td>
              <td>{new Date(rainout.rainout_time).toLocaleString()}</td>
              <td>{rainout.status_ride}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

export default RideAttendantDash