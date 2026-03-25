import { useState, useEffect } from 'react'
import '../styles/park-map.css'

function ParkMap({ token }) {
  const [rides, setRides] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ridesRes, venuesRes] = await Promise.all([
          fetch('/api/rides/all', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/venues/list', { headers: { 'Authorization': `Bearer ${token}` } })
        ])

        if (ridesRes.ok) {
          const ridesData = await ridesRes.json()
          setRides(ridesData)
        }
        if (venuesRes.ok) {
          const venuesData = await venuesRes.json()
          setVenues(venuesData)
        }
      } catch (err) {
        console.error('Error fetching map data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const allLocations = [
    ...rides.map(r => ({
      id: `ride-${r.ride_id}`,
      name: r.ride_name,
      type: 'ride',
      subtype: r.ride_type,
      lat: parseFloat(r.ride_lat),
      long: parseFloat(r.ride_long),
      status: r.status_ride,
      data: r
    })),
    ...venues.map(v => ({
      id: `venue-${v.venue_id}`,
      name: v.venue_name,
      type: 'venue',
      subtype: v.venue_type,
      lat: parseFloat(v.venue_lat),
      long: parseFloat(v.venue_long),
      data: v
    }))
  ]

  const filteredLocations = allLocations.filter(loc => {
    if (filter === 'all') return true
    if (filter === 'rides') return loc.type === 'ride'
    if (filter === 'shops') return loc.subtype === 'shop'
    if (filter === 'restaurants') return loc.subtype === 'restaurant'
    if (filter === 'shows') return loc.subtype === 'show'
    return true
  })

  // Calculate bounds for scaling
  const lats = allLocations.map(l => l.lat).filter(l => !isNaN(l))
  const longs = allLocations.map(l => l.long).filter(l => !isNaN(l))

  const minLat = Math.min(...lats) - 0.001
  const maxLat = Math.max(...lats) + 0.001
  const minLong = Math.min(...longs) - 0.001
  const maxLong = Math.max(...longs) + 0.001

  const mapWidth = 800
  const mapHeight = 600
  const padding = 40

  const scaleX = (long) => {
    if (longs.length === 0) return mapWidth / 2
    return padding + ((long - minLong) / (maxLong - minLong)) * (mapWidth - 2 * padding)
  }

  const scaleY = (lat) => {
    if (lats.length === 0) return mapHeight / 2
    return mapHeight - padding - ((lat - minLat) / (maxLat - minLat)) * (mapHeight - 2 * padding)
  }

  const getMarkerColor = (location) => {
    if (location.type === 'ride') {
      if (location.status === 'open') return '#28a745'
      if (location.status === 'broken') return '#dc3545'
      if (location.status === 'maintenance') return '#ffc107'
      return '#6c757d'
    }
    if (location.subtype === 'shop') return '#17a2b8'
    if (location.subtype === 'restaurant') return '#fd7e14'
    if (location.subtype === 'show') return '#6f42c1'
    return '#6c757d'
  }

  const getMarkerShape = (location) => {
    if (location.type === 'ride') return 'circle'
    if (location.subtype === 'shop') return 'square'
    if (location.subtype === 'restaurant') return 'diamond'
    if (location.subtype === 'show') return 'triangle'
    return 'circle'
  }

  if (loading) return <div className="map-panel">Loading map...</div>

  return (
    <div className="map-panel">
      <div className="map-header">
        <h3>Park Map</h3>
        <div className="map-filters">
          <button 
            className={`map-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`map-filter-btn ${filter === 'rides' ? 'active' : ''}`}
            onClick={() => setFilter('rides')}
          >
            Rides
          </button>
          <button 
            className={`map-filter-btn ${filter === 'shops' ? 'active' : ''}`}
            onClick={() => setFilter('shops')}
          >
            Shops
          </button>
          <button 
            className={`map-filter-btn ${filter === 'restaurants' ? 'active' : ''}`}
            onClick={() => setFilter('restaurants')}
          >
            Restaurants
          </button>
          <button 
            className={`map-filter-btn ${filter === 'shows' ? 'active' : ''}`}
            onClick={() => setFilter('shows')}
          >
            Shows
          </button>
        </div>
      </div>

      <div className="map-container">
        <svg 
          viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
          className="map-svg"
        >
          {/* Background */}
          <rect x="0" y="0" width={mapWidth} height={mapHeight} fill="#e8f5e9" />
          
          {/* Grid lines */}
          {[...Array(10)].map((_, i) => (
            <g key={i}>
              <line 
                x1={padding + i * ((mapWidth - 2 * padding) / 9)} 
                y1={padding} 
                x2={padding + i * ((mapWidth - 2 * padding) / 9)} 
                y2={mapHeight - padding} 
                stroke="#c8e6c9" 
                strokeWidth="1"
              />
              <line 
                x1={padding} 
                y1={padding + i * ((mapHeight - 2 * padding) / 9)} 
                x2={mapWidth - padding} 
                y2={padding + i * ((mapHeight - 2 * padding) / 9)} 
                stroke="#c8e6c9" 
                strokeWidth="1"
              />
            </g>
          ))}

          {/* Border */}
          <rect 
            x={padding} 
            y={padding} 
            width={mapWidth - 2 * padding} 
            height={mapHeight - 2 * padding} 
            fill="none" 
            stroke="#81c784" 
            strokeWidth="2"
          />

          {/* Location markers */}
          {filteredLocations.map(location => {
            const x = scaleX(location.long)
            const y = scaleY(location.lat)
            const color = getMarkerColor(location)
            const shape = getMarkerShape(location)
            const isSelected = selected?.id === location.id

            return (
              <g 
                key={location.id} 
                onClick={() => setSelected(location)}
                className="map-marker"
              >
                {shape === 'circle' && (
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={isSelected ? 12 : 8} 
                    fill={color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                )}
                {shape === 'square' && (
                  <rect 
                    x={x - (isSelected ? 10 : 7)} 
                    y={y - (isSelected ? 10 : 7)} 
                    width={isSelected ? 20 : 14} 
                    height={isSelected ? 20 : 14} 
                    fill={color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                )}
                {shape === 'diamond' && (
                  <polygon 
                    points={`${x},${y - (isSelected ? 12 : 9)} ${x + (isSelected ? 12 : 9)},${y} ${x},${y + (isSelected ? 12 : 9)} ${x - (isSelected ? 12 : 9)},${y}`}
                    fill={color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                )}
                {shape === 'triangle' && (
                  <polygon 
                    points={`${x},${y - (isSelected ? 12 : 9)} ${x + (isSelected ? 11 : 8)},${y + (isSelected ? 8 : 6)} ${x - (isSelected ? 11 : 8)},${y + (isSelected ? 8 : 6)}`}
                    fill={color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                )}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="map-legend">
          <h4>Legend</h4>
          <div className="legend-section">
            <span className="legend-title">Rides</span>
            <div className="legend-item">
              <span className="legend-marker circle" style={{ backgroundColor: '#28a745' }}></span>
              Open
            </div>
            <div className="legend-item">
              <span className="legend-marker circle" style={{ backgroundColor: '#ffc107' }}></span>
              Maintenance
            </div>
            <div className="legend-item">
              <span className="legend-marker circle" style={{ backgroundColor: '#dc3545' }}></span>
              Broken
            </div>
            <div className="legend-item">
              <span className="legend-marker circle" style={{ backgroundColor: '#6c757d' }}></span>
              Closed
            </div>
          </div>
          <div className="legend-section">
            <span className="legend-title">Venues</span>
            <div className="legend-item">
              <span className="legend-marker square" style={{ backgroundColor: '#17a2b8' }}></span>
              Shop
            </div>
            <div className="legend-item">
              <span className="legend-marker diamond" style={{ backgroundColor: '#fd7e14' }}></span>
              Restaurant
            </div>
            <div className="legend-item">
              <span className="legend-marker triangle" style={{ backgroundColor: '#6f42c1' }}></span>
              Show
            </div>
          </div>
        </div>
      </div>

      {/* Selected location info */}
      {selected && (
        <div className="map-info-panel">
          <div className="map-info-header">
            <h4>{selected.name}</h4>
            <button className="map-info-close" onClick={() => setSelected(null)}>×</button>
          </div>
          <div className="map-info-content">
            <div className="map-info-row">
              <span className="map-info-label">Type:</span>
              <span>{selected.type === 'ride' ? `Ride (${selected.subtype})` : `Venue (${selected.subtype})`}</span>
            </div>
            {selected.type === 'ride' && (
              <div className="map-info-row">
                <span className="map-info-label">Status:</span>
                <span className={`status-badge status-${selected.status}`}>
                  {selected.status.replace('_', ' ')}
                </span>
              </div>
            )}
            <div className="map-info-row">
              <span className="map-info-label">Coordinates:</span>
              <span>{selected.lat.toFixed(6)}, {selected.long.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}

      {allLocations.length === 0 && (
        <div className="map-empty">
          No locations found. Add rides and venues to see them on the map.
        </div>
      )}
    </div>
  )
}

export default ParkMap