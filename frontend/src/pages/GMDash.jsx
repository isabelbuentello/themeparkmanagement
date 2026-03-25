import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddRide from '../components/AddRide'
import GMForms from '../components/GMForms'
import '../styles/gm-dash.css'

function GMDash() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [showAddRide, setShowAddRide] = useState(false)
  const [showEmergencies, setShowEmergencies] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  
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
    <div className="gm-dash-container">
      <div className="gm-header-bar">
        <h1>General Manager Dashboard</h1>
        <button className="gm-btn-back" onClick={() => navigate('/employee')}>Back to Employee Dashboard</button>
      </div>

      <h2 className="gm-section-title">Management Tools</h2>
      <div className="gm-tools-nav">
        <button 
          className={`gm-tool-btn ${showAddRide ? 'active' : ''}`} 
          onClick={() => { setShowAddRide(!showAddRide); setShowEmergencies(false); setShowConfig(false) }}>
          Add New Ride
        </button>
        <button 
          className={`gm-tool-btn ${showEmergencies ? 'active' : ''}`} 
          onClick={() => { setShowEmergencies(!showEmergencies); setShowAddRide(false); setShowConfig(false); fetchEmergencies() }}>
          View Emergencies
        </button>
        <button 
          className={`gm-tool-btn ${showConfig ? 'active' : ''}`} 
          onClick={() => { setShowConfig(!showConfig); setShowAddRide(false); setShowEmergencies(false) }}>
          Park Configuration
        </button>
        <button className="gm-tool-btn">Manage Employees</button>
      </div>

      {/* RENDER COMPONENTS BASED ON STATE */}
      {showAddRide && <AddRide onRideAdded={fetchRides} />}
      {showConfig && <GMForms token={token} />}

      {showEmergencies && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="gm-section-title">Emergency Events</h3>
          <div className="gm-table-wrapper">
            <table className="gm-table">
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
        </div>
      )}

      <h3 className="gm-section-title">All Rides</h3>
      <div className="gm-table-wrapper">
        <table className="gm-table">
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
                <td>{ride.affected_by_rain ? 'Yes' : 'No'}</td>
                <td>
                  <span style={{ 
                    color: ride.status_ride === 'open' ? 'green' : ride.status_ride === 'broken' ? 'red' : 'orange',
                    fontWeight: 'bold'
                  }}>
                    {ride.status_ride.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default GMDash