import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddRide from '../components/AddRide'
import GMForms from '../components/GMForms'
import ParkDayStats from '../components/ParkDayStats'
import RevenueStats from '../components/RevenueStats'
import CustomerLoyaltyReport from '../components/CustomerLoyaltyReport'
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
  const [complaints, setComplaints] = useState([])
  const [reviews, setReviews] = useState([]) 

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

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/feedback/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setComplaints(await res.json())
    } catch (err) {
      console.error('Error fetching complaints')
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/feedback/reviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setReviews(await res.json())
    } catch (err) {
      console.error('Error fetching reviews')
    }
  }

  const toggleComplaintResolved = async (complaint_id, currentStatus) => {
    try {
      const res = await fetch(`/api/feedback/complaints/${complaint_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resolved: !currentStatus })
      })
      if (res.ok) fetchComplaints()
    } catch (err) {
      console.error('Error updating complaint')
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
        <button className={`gm-tool-btn ${activePanel === 'addRide' ? 'active' : ''}`} onClick={() => togglePanel('addRide')}>Add New Ride</button>
        <button className={`gm-tool-btn ${activePanel === 'emergencies' ? 'active' : ''}`} onClick={() => togglePanel('emergencies', fetchEmergencies)}>View Emergencies</button>
        <button className={`gm-tool-btn ${activePanel === 'config' ? 'active' : ''}`} onClick={() => togglePanel('config')}>Park Configuration</button>
        <button className={`gm-tool-btn ${activePanel === 'rainouts' ? 'active' : ''}`} onClick={() => togglePanel('rainouts', fetchRainouts)}>Rainout Tracking</button>
        <button className={`gm-tool-btn ${activePanel === 'parkDay' ? 'active' : ''}`} onClick={() => togglePanel('parkDay')}>Park Day Stats</button>
        <button className={`gm-tool-btn ${activePanel === 'revenue' ? 'active' : ''}`} onClick={() => togglePanel('revenue')}>Revenue</button>
        <button className={`gm-tool-btn ${activePanel === 'loyalty' ? 'active' : ''}`} onClick={() => togglePanel('loyalty')}>Customer Loyalty</button>
        <button className={`gm-tool-btn ${activePanel === 'employees' ? 'active' : ''}`} onClick={() => togglePanel('employees')}>Manage Employees</button>
        <button className={`gm-tool-btn ${activePanel === 'departments' ? 'active' : ''}`} onClick={() => togglePanel('departments')}>Manage Departments</button>
        <button className={`gm-tool-btn ${activePanel === 'venues' ? 'active' : ''}`} onClick={() => togglePanel('venues')}>Manage Venues</button>
        <button className={`gm-tool-btn ${activePanel === 'complaints' ? 'active' : ''}`} onClick={() => togglePanel('complaints', fetchComplaints)}>View Complaints</button>
        <button className={`gm-tool-btn ${activePanel === 'reviews' ? 'active' : ''}`} onClick={() => togglePanel('reviews', fetchReviews)}>View Reviews</button>
      </div>

      {activePanel === 'addRide' && <AddRide onRideAdded={fetchRides} />}
      {activePanel === 'config' && <GMForms token={token} />}
      {activePanel === 'employees' && <ManageEmployees token={token} />}
      {activePanel === 'departments' && <ManageDepartments token={token} />}
      {activePanel === 'venues' && <ManageVenues token={token} />}
      {activePanel === 'parkDay' && <ParkDayStats token={token} />}
      {activePanel === 'revenue' && <RevenueStats token={token} />}
      {activePanel === 'loyalty' && <CustomerLoyaltyReport token={token} />}

      {activePanel === 'emergencies' && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="gm-section-title">Emergency Events</h3>
          <div className="gm-table-wrapper">
            <table className="gm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {emergencies.map((e) => (
                  <tr key={e.event_id}>
                    <td>{e.event_id}</td>
                    <td>{e.date_of_emergency}</td>
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
                    <td colSpan="4" style={{ textAlign: 'center' }}>No rainouts recorded</td>
                  </tr>
                ) : (
                  rainouts.map((rainout) => (
                    <tr key={rainout.rainout_id}>
                      <td>{rainout.rainout_id}</td>
                      <td>{rainout.ride_name}</td>
                      <td>{new Date(rainout.rainout_time).toLocaleString()}</td>
                      <td>
                        <span style={{ color: rainout.status_ride === 'closed_weather' ? 'orange' : 'green', fontWeight: 'bold' }}>
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

      {activePanel === 'complaints' && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="gm-section-title">Customer Complaints</h3>
          <div className="gm-table-wrapper">
            <table className="gm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer ID</th>
                  <th>Venue</th>
                  <th>Ride</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No complaints found</td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.complaint_id}>
                      <td>{c.complaint_id}</td>
                      <td>{c.customer_id || 'Anonymous'}</td>
                      <td>{c.venue_id || '—'}</td>
                      <td>{c.ride_id || '—'}</td>
                      <td>{c.complaint_description}</td>
                      <td>{new Date(c.created_date).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => toggleComplaintResolved(c.complaint_id, c.resolved)}
                          style={{
                            background: c.resolved ? 'green' : 'orange',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          {c.resolved ? 'RESOLVED' : 'UNRESOLVED'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePanel === 'reviews' && (
        <div style={{ marginBottom: '3rem' }}>
          <h3 className="gm-section-title">Customer Reviews</h3>
          <div className="gm-table-wrapper">
            <table className="gm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer ID</th>
                  <th>Venue</th>
                  <th>Ride</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center' }}>No reviews found</td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.review_id}>
                      <td>{r.review_id}</td>
                      <td>{r.customer_id}</td>
                      <td>{r.venue_id || '—'}</td>
                      <td>{r.ride_id || '—'}</td>
                      <td>{'⭐'.repeat(r.rating / 2)} ({r.rating / 2}/5)</td>
                      <td>{r.comment}</td>
                      <td>{new Date(r.review_created_date).toLocaleDateString()}</td>
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
                  <span style={{ color: ride.status_ride === 'open' ? 'green' : ride.status_ride === 'broken' ? 'red' : 'orange', fontWeight: 'bold' }}>
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
