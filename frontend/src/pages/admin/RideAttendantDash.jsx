import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/gm-dash.css'

const STATUS_OPTIONS = ['open', 'broken', 'maintenance', 'closed_weather']

function RideAttendantDash() {
  const navigate = useNavigate()
  const [rides, setRides] = useState([])
  const [queueOverview, setQueueOverview] = useState([])
  const [selectedRideName, setSelectedRideName] = useState('')
  const [reservations, setReservations] = useState([])
  const [pendingStatus, setPendingStatus] = useState({})
  const [originalStatus, setOriginalStatus] = useState({})
  const [isSavingAll, setIsSavingAll] = useState(false)
  const [rideError, setRideError] = useState('')
  const [rideMessage, setRideMessage] = useState('')
  const [queueError, setQueueError] = useState('')
  const [queueMessage, setQueueMessage] = useState('')

  const token = localStorage.getItem('token')

  const loadDashboard = async () => {
    setRideError('')
    setQueueError('')
    try {
      const [ridesRes, queueRes] = await Promise.all([
        fetch('/api/rides', {
          headers: { Authorization: 'Bearer ' + token }
        }),
        fetch('/api/rides/queue-overview', {
          headers: { Authorization: 'Bearer ' + token }
        })
      ])

      const ridesData = await ridesRes.json()
      const queueData = await queueRes.json()

      if (!ridesRes.ok) {
        setRideError(ridesData.message || 'Failed to load rides')
        return
      }

      if (!queueRes.ok) {
        setQueueError(queueData.message || 'Failed to load queue overview')
        return
      }

      setRides(ridesData)
      setQueueOverview(queueData)

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
  }, [])

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
    </div>
  )
}

export default RideAttendantDash