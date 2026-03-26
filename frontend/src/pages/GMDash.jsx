import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddRide from '../components/AddRide'
import GMForms from '../components/GMForms'
import ParkDayStats from '../components/ParkDayStats'
import RevenueStats from '../components/RevenueStats'
import ManageEmployees from '../components/ManageEmployees'
import ManageDepartments from '../components/ManageDepartments'
import ManageVenues from '../components/ManageVenues'
import '../styles/gm-dash.css'

function GMDash() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [activePanel, setActivePanel] = useState(null)
  const [rides, setRides] = useState([])
  const [emergencies, setEmergencies] = useState([])
  const [rainouts, setRainouts] = useState([])
  const [rainoutError, setRainoutError] = useState('')

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
    } catch (err) {
      console.error('Error fetching emergencies')
    }
  }

  const fetchRainouts = async () => {
    try {
      const res = await fetch('/api/rides/rainouts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setRainouts(await res.json())
        setRainoutError('')
      } else {
        const errorData = await res.json()
        setRainoutError(`Error (${res.status}): ${errorData.message || 'Failed to load rainout history'}`)
        console.error('Rainout fetch error:', errorData)
      }
    } catch (err) {
      setRainoutError('Error fetching rainouts: ' + err.message)
      console.error(err)
    }
  }

  const togglePanel = (panel, onOpen) => {
    if (activePanel === panel) {
      setActivePanel(null)
    } else {
      setActivePanel(panel)
      if (onOpen) onOpen()
    }
  }

  useEffect(() => {
    fetchRides()
  }, [])

  return (
    <div className="gm-dash-container">
      <div className="gm-header-bar">
        <h1>General Manager Dashboard</h1>
        <button className="gm-btn-back" onClick={() => navigate('/account/employee')}>Back to Employee Dashboard</button>
      </div>

      <h2 className="gm-section-title">Management Tools</h2>
      <div className="gm-tools-nav">
        <button
          className={`gm-tool-btn ${activePanel === 'addRide' ? 'active' : ''}`}
          onClick={() => togglePanel('addRide')}
        >
          Add New Ride
        </button>
        <button
          className={`gm-tool-btn ${activePanel === 'emergencies' ? 'active' : ''}`}
          onClick={() => togglePanel('emergencies', fetchEmergencies)}
        >
          View Emergencies
        </button>
        <button
          className={`gm-tool-btn ${activePanel === 'config' ? 'active' : ''}`}
          onClick={() => togglePanel('config')}
        >
          Park Configuration
        </button>
        <button
          className={`gm-tool-btn ${activePanel === 'rainouts' ? 'active' : ''}`}
          onClick={() => togglePanel('rainouts', fetchRainouts)}
        >
          Rainout Tracking
        </button>
        <button
          className={`gm-tool-btn ${activePanel === 'parkDay' ? 'active' : ''}`}
          onClick={() => togglePanel('parkDay')}
        >
          Park Day Stats
        </button>
        <button
          className={`gm-tool-btn ${activePanel === 'revenue' ? 'active' : ''}`}
          onClick={() => togglePanel('revenue')}
        >
          Revenue
        </button>
        <button
          className={`gm-tool-btn ${activePanel === 'employees' ? 'active' : ''}`}
          onClick={() => togglePanel('employees')}
        >
          Manage Employees
        </button>
        <button
          className={`gm-tool-btn ${activePanel === 'departments' ? 'active' : ''}`}
          onClick={() => togglePanel('departments')}
        >
          Manage Departments
        </button>
        <button
          className={`gm-tool-btn ${activePanel === 'venues' ? 'active' : ''}`}
          onClick={() => togglePanel('venues')}
        >
          Manage Venues
        </button>
      </div>

      {activePanel === 'addRide' && <AddRide onRideAdded={fetchRides} />}
      {activePanel === 'config' && <GMForms token={token} />}
      {activePanel === 'employees' && <ManageEmployees token={token} />}
      {activePanel === 'departments' && <ManageDepartments token={token} />}
      {activePanel === 'venues' && <ManageVenues token={token} />}
      {activePanel === 'parkDay' && <ParkDayStats token={token} />}
      {activePanel === 'revenue' && <RevenueStats token={token} />}

      {activePanel === 'emergencies' && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="gm-section-title">Emergency Events</h3>
          <div className="gm-table-wrapper">
            <table className="gm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Lat</th>
                  <th>Long</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {emergencies.map((e) => (
                  <tr key={e.event_id}>
                    <td>{e.event_id}</td>
                    <td>{e.date_of_emergency}</td>
                    <td>{e.event_lat}</td>
                    <td>{e.event_long}</td>
                    <td>{e.event_description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePanel === 'rainouts' && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="gm-section-title">Rainout Tracking History</h3>
          {rainoutError && <p style={{ color: 'red', marginBottom: '1rem' }}>{rainoutError}</p>}
          <div className="gm-table-wrapper">
            <table className="gm-table">
              <thead>
                <tr>
                  <th>Rainout ID</th>
                  <th>Ride Name</th>
                  <th>Rainout Time</th>
                  <th>Current Status</th>
                </tr>
              </thead>
              <tbody>
                {rainouts.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center' }}>
                      No rainouts recorded
                    </td>
                  </tr>
                ) : (
                  rainouts.map((rainout) => (
                    <tr key={rainout.rainout_id}>
                      <td>{rainout.rainout_id}</td>
                      <td>{rainout.ride_name}</td>
                      <td>{new Date(rainout.rainout_time).toLocaleString()}</td>
                      <td>
                        <span
                          style={{
                            color: rainout.status_ride === 'closed_weather' ? 'orange' : 'green',
                            fontWeight: 'bold'
                          }}
                        >
                          {rainout.status_ride.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
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
            {rides.map((ride) => (
              <tr key={ride.ride_id}>
                <td>{ride.ride_id}</td>
                <td>{ride.ride_name}</td>
                <td>{ride.ride_type}</td>
                <td>{ride.is_seasonal ? 'Yes' : 'No'}</td>
                <td>{ride.size_sqft}</td>
                <td>{ride.speed_mph}</td>
                <td>{ride.min_height_ft}</td>
                <td>{ride.affected_by_rain ? 'Yes' : 'No'}</td>
                <td>
                  <span
                    style={{
                      color: ride.status_ride === 'open' ? 'green' : ride.status_ride === 'broken' ? 'red' : 'orange',
                      fontWeight: 'bold'
                    }}
                  >
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
