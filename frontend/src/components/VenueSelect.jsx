// src/components/VenueSelect.jsx
import { useState, useEffect } from 'react'

function VenueSelect({ token, value, onChange, className, filterType }) {
  const [venues, setVenues] = useState([])

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch('/api/venues/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          let data = await res.json()
          if (filterType) {
            data = data.filter(v => v.venue_type === filterType)
          }
          setVenues(data)
        }
      } catch (err) {
        console.error('Error fetching venues')
      }
    }
    fetchVenues()
  }, [token, filterType])

  return (
    <select className={className} value={value} onChange={onChange}>
      <option value="">Select venue</option>
      {venues.map(v => (
        <option key={v.venue_id} value={v.venue_id}>
          {v.venue_name} ({v.venue_type})
        </option>
      ))}
    </select>
  )
}

export default VenueSelect