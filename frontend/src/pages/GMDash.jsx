import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddRide from '../components/AddRide'

function GMDash() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [showAddRide, setShowAddRide] = useState(false)
  const [showEmergencies, setShowEmergencies] = useState(false)
  const [rides, setRides] = useState([])
  const [emergencies, setEmergencies] = useState([])

  const fetchRides = async () => {
    try {
      const res = await fetch('/api/rides/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setRides(await res.json())
    } catch (err) { console.error('Error fetching rides') }
  }

  const fetchEmergencies = async () => {
    try {
      const res = await fetch('/api/park/emergency', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setEmergencies(await res.json())
    } catch (err) { console.error('Error fetching emergencies') }
  }

  useEffect(() => { fetchRides() }, [])

  return (
    <div>
      <h1>General Manager Dashboard</h1>
      <button onClick={() => navigate('/employee')}>Back to Employee Dashboard</button>

      <h2>Management Tools</h2>
      <button onClick={() => { setShowAddRide(!showAddRide); setShowEmergencies(false) }}>
        Add New Ride
      </button>
      <button onClick={() => { setShowEmergencies(!showEmergencies); setShowAddRide(false); fetchEmergencies() }}>
        View Emergencies
      </button>
      <button>Manage Employees</button>

      {showAddRide && <AddRide onRideAdded={fetchRides} />}

      {showEmergencies && (
        <div>
          <h3>Emergency Events</h3>
          <table border="1" cellPadding="5">
            <thead>
              <tr><th>ID</th><th>Date</th><th>Lat</th><th>Long</th><th>Description</th></tr>
            </thead>
            <tbody>
              {emergencies.map(e => (
                <tr key={e.event_id}>
                  <td>{e.event_id}</td><td>{e.date_of_emergency}</td>
                  <td>{e.event_lat}</td><td>{e.event_long}</td>
                  <td>{e.event_description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>All Rides</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Type</th><th>Seasonal</th>
            <th>Size</th><th>Speed</th><th>Min Height</th><th>Rain</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rides.map(ride => (
            <tr key={ride.ride_id}>
              <td>{ride.ride_id}</td><td>{ride.ride_name}</td><td>{ride.ride_type}</td>
              <td>{ride.is_seasonal ? 'Yes' : 'No'}</td><td>{ride.size_sqft}</td>
              <td>{ride.speed_mph}</td><td>{ride.min_height_ft}</td>
              <td>{ride.affected_by_rain ? 'Yes' : 'No'}</td><td>{ride.status_ride}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default GMDash