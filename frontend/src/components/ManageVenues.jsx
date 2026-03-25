import { useState, useEffect } from 'react'
import '../styles/manage-venues.css'

function ManageVenues({ token }) {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [filters, setFilters] = useState({ search: '', type: '' })

  const [newVenue, setNewVenue] = useState({
    venue_type: 'shop',
    venue_name: '',
    hours: '',
    venue_lat: '',
    venue_long: '',
    space_for_items_sqft: '',
    requires_booking: false,
    price_range: 1,
    seating_capacity: '',
    show_category: 'musician',
    duration: 30
  })

  const venueTypes = ['shop', 'restaurant', 'show']
  const showCategories = ['magician', 'puppets', 'clown', 'musician']

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/venues', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setVenues(await res.json())
    } catch (err) {
      console.error('Error fetching venues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVenues()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newVenue)
      })
      if (res.ok) {
        setShowForm(false)
        setNewVenue({
          venue_type: 'shop',
          venue_name: '',
          hours: '',
          venue_lat: '',
          venue_long: '',
          space_for_items_sqft: '',
          requires_booking: false,
          price_range: 1,
          seating_capacity: '',
          show_category: 'musician',
          duration: 30
        })
        fetchVenues()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to create venue')
      }
    } catch (err) {
      alert('Error creating venue')
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete venue "${name}"? This may fail if it has associated data.`)) return
    try {
      const res = await fetch(`/api/venues/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setVenues(venues.filter(v => v.venue_id !== id))
        setSelectedVenue(null)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to delete venue')
      }
    } catch (err) {
      alert('Error deleting venue')
    }
  }

  const filteredVenues = venues.filter(v => {
    const matchesSearch = v.venue_name.toLowerCase().includes(filters.search.toLowerCase())
    const matchesType = !filters.type || v.venue_type === filters.type
    return matchesSearch && matchesType
  })

  const clearFilters = () => {
    setFilters({ search: '', type: '' })
  }

  if (loading) return <div className="venue-panel">Loading venues...</div>

  return (
    <div className="venue-panel">
      <div className="venue-header">
        <h3>Venue Management</h3>
        <button
          className={`venue-btn ${showForm ? 'venue-btn-cancel' : 'venue-btn-add'}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Venue'}
        </button>
      </div>

      {showForm && (
        <div className="venue-form-card">
          <h4>New Venue</h4>
          <form onSubmit={handleCreate}>
            <div className="venue-form-grid">
              <div className="venue-form-group">
                <label className="venue-label">Venue Type *</label>
                <select
                  className="venue-select"
                  value={newVenue.venue_type}
                  onChange={e => setNewVenue({ ...newVenue, venue_type: e.target.value })}
                >
                  {venueTypes.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="venue-form-group">
                <label className="venue-label">Venue Name *</label>
                <input
                  className="venue-input"
                  value={newVenue.venue_name}
                  onChange={e => setNewVenue({ ...newVenue, venue_name: e.target.value })}
                  placeholder="e.g. Main Street Gift Shop"
                  required
                />
              </div>

              <div className="venue-form-group">
                <label className="venue-label">Hours *</label>
                <input
                  className="venue-input"
                  value={newVenue.hours}
                  onChange={e => setNewVenue({ ...newVenue, hours: e.target.value })}
                  placeholder="e.g. 9AM-9PM"
                  required
                />
              </div>

              <div className="venue-form-group">
                <label className="venue-label">Latitude *</label>
                <input
                  className="venue-input"
                  type="number"
                  step="0.000001"
                  value={newVenue.venue_lat}
                  onChange={e => setNewVenue({ ...newVenue, venue_lat: e.target.value })}
                  placeholder="e.g. 29.760427"
                  required
                />
              </div>

              <div className="venue-form-group">
                <label className="venue-label">Longitude *</label>
                <input
                  className="venue-input"
                  type="number"
                  step="0.000001"
                  value={newVenue.venue_long}
                  onChange={e => setNewVenue({ ...newVenue, venue_long: e.target.value })}
                  placeholder="e.g. -95.369804"
                  required
                />
              </div>
            </div>

            {newVenue.venue_type === 'shop' && (
              <div className="venue-type-fields">
                <h5>Shop Details</h5>
                <div className="venue-form-group">
                  <label className="venue-label">Space for Items (sqft)</label>
                  <input
                    className="venue-input"
                    type="number"
                    min="0"
                    value={newVenue.space_for_items_sqft}
                    onChange={e => setNewVenue({ ...newVenue, space_for_items_sqft: e.target.value })}
                  />
                </div>
              </div>
            )}

            {newVenue.venue_type === 'restaurant' && (
              <div className="venue-type-fields">
                <h5>Restaurant Details</h5>
                <div className="venue-form-grid">
                  <div className="venue-form-group">
                    <label className="venue-label">Seating Capacity</label>
                    <input
                      className="venue-input"
                      type="number"
                      min="0"
                      value={newVenue.seating_capacity}
                      onChange={e => setNewVenue({ ...newVenue, seating_capacity: e.target.value })}
                    />
                  </div>
                  <div className="venue-form-group">
                    <label className="venue-label">Price Range (1-5)</label>
                    <input
                      className="venue-input"
                      type="number"
                      min="1"
                      max="5"
                      value={newVenue.price_range}
                      onChange={e => setNewVenue({ ...newVenue, price_range: e.target.value })}
                    />
                  </div>
                  <div className="venue-form-group venue-checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={newVenue.requires_booking}
                        onChange={e => setNewVenue({ ...newVenue, requires_booking: e.target.checked })}
                      />
                      Requires Booking
                    </label>
                  </div>
                </div>
              </div>
            )}

            {newVenue.venue_type === 'show' && (
              <div className="venue-type-fields">
                <h5>Show Details</h5>
                <div className="venue-form-grid">
                  <div className="venue-form-group">
                    <label className="venue-label">Show Category</label>
                    <select
                      className="venue-select"
                      value={newVenue.show_category}
                      onChange={e => setNewVenue({ ...newVenue, show_category: e.target.value })}
                    >
                      {showCategories.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="venue-form-group">
                    <label className="venue-label">Duration (minutes)</label>
                    <input
                      className="venue-input"
                      type="number"
                      min="0"
                      max="120"
                      value={newVenue.duration}
                      onChange={e => setNewVenue({ ...newVenue, duration: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="venue-btn venue-btn-submit">Create Venue</button>
          </form>
        </div>
      )}

      <div className="venue-filters">
        <div className="venue-filter-group">
          <label className="venue-label">Search</label>
          <input
            className="venue-input"
            type="text"
            placeholder="Venue name..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="venue-filter-group">
          <label className="venue-label">Type</label>
          <select
            className="venue-select"
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            {venueTypes.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <button className="venue-btn venue-btn-clear" onClick={clearFilters}>
          Clear
        </button>
      </div>

      <div className="venue-table-wrapper">
        <table className="venue-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Hours</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVenues.length === 0 ? (
              <tr>
                <td colSpan="6" className="venue-empty">No venues found.</td>
              </tr>
            ) : (
              filteredVenues.map(venue => (
                <tr key={venue.venue_id} onClick={() => setSelectedVenue(venue)} className="venue-row-clickable">
                  <td>{venue.venue_id}</td>
                  <td>{venue.venue_name}</td>
                  <td>
                    <span className={`venue-type-badge venue-type-${venue.venue_type}`}>
                      {venue.venue_type}
                    </span>
                  </td>
                  <td>{venue.hours}</td>
                  <td>{venue.venue_lat}, {venue.venue_long}</td>
                  <td>
                    <button
                      className="venue-btn venue-btn-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(venue.venue_id, venue.venue_name)
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedVenue && (
        <VenueDetailModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
        />
      )}
    </div>
  )
}

function VenueDetailModal({ venue, onClose }) {
  return (
    <div className="venue-modal-overlay" onClick={onClose}>
      <div className="venue-modal" onClick={e => e.stopPropagation()}>
        <div className="venue-modal-header">
          <h4>{venue.venue_name}</h4>
          <button className="venue-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="venue-modal-content">
          <div className="venue-detail-row">
            <span className="venue-detail-label">Venue ID:</span>
            <span>{venue.venue_id}</span>
          </div>
          <div className="venue-detail-row">
            <span className="venue-detail-label">Type:</span>
            <span className={`venue-type-badge venue-type-${venue.venue_type}`}>
              {venue.venue_type}
            </span>
          </div>
          <div className="venue-detail-row">
            <span className="venue-detail-label">Hours:</span>
            <span>{venue.hours}</span>
          </div>
          <div className="venue-detail-row">
            <span className="venue-detail-label">Latitude:</span>
            <span>{venue.venue_lat}</span>
          </div>
          <div className="venue-detail-row">
            <span className="venue-detail-label">Longitude:</span>
            <span>{venue.venue_long}</span>
          </div>

          {venue.venue_type === 'shop' && (
            <>
              <h5 className="venue-detail-section">Shop Details</h5>
              <div className="venue-detail-row">
                <span className="venue-detail-label">Space (sqft):</span>
                <span>{venue.space_for_items_sqft || '—'}</span>
              </div>
              <div className="venue-detail-row">
                <span className="venue-detail-label">Total Merch Sold:</span>
                <span>{venue.total_merch_sold || 0}</span>
              </div>
            </>
          )}

          {venue.venue_type === 'restaurant' && (
            <>
              <h5 className="venue-detail-section">Restaurant Details</h5>
              <div className="venue-detail-row">
                <span className="venue-detail-label">Seating Capacity:</span>
                <span>{venue.seating_capacity || '—'}</span>
              </div>
              <div className="venue-detail-row">
                <span className="venue-detail-label">Price Range:</span>
                <span>{'$'.repeat(venue.price_range || 1)}</span>
              </div>
              <div className="venue-detail-row">
                <span className="venue-detail-label">Requires Booking:</span>
                <span>{venue.requires_booking ? 'Yes' : 'No'}</span>
              </div>
            </>
          )}

          {venue.venue_type === 'show' && (
            <>
              <h5 className="venue-detail-section">Show Details</h5>
              <div className="venue-detail-row">
                <span className="venue-detail-label">Category:</span>
                <span>{venue.show_category || '—'}</span>
              </div>
              <div className="venue-detail-row">
                <span className="venue-detail-label">Duration:</span>
                <span>{venue.duration || '—'} minutes</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageVenues