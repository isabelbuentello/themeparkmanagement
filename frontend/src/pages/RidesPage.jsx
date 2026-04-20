import { useEffect, useState } from 'react'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'

function formatRideStatus(value) {
  return String(value || '').replaceAll('_', ' ')
}

function getStatusPillStyle(status) {
  if (status === 'open') {
    return {
      background: 'rgba(22, 163, 74, 0.14)',
      color: '#166534'
    }
  }

  if (status === 'broken') {
    return {
      background: 'rgba(220, 38, 38, 0.14)',
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
      background: 'rgba(59, 130, 246, 0.14)',
      color: '#2563eb'
    }
  }

  return {
    background: 'rgba(100, 116, 139, 0.14)',
    color: '#475569'
  }
}

function RidesPage() {
  const [rides, setRides] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadRides = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const response = await fetch('/api/rides/all')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load rides right now.')
        }

        if (isMounted) {
          setRides(data)
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err.message || 'Unable to load rides right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadRides()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page">
      <PageHero
        title="Rides"
        subtitle="Browse current ride information and status across the park."
      />

      <section className="content-card">
        <AsyncState
          isLoading={isLoading}
          error={loadError}
          isEmpty={!isLoading && !loadError && rides.length === 0}
          loadingMessage="Loading rides..."
          emptyMessage="No rides available right now."
        />

        {!isLoading && !loadError && rides.length > 0 ? (
          <div className="purchase-grid">
            {rides.map((ride, index) => (
              <article
                key={ride.ride_id}
                className={`purchase-card${index === 0 ? ' purchase-card-featured' : ''}`}
              >
                <p className="purchase-type">{ride.ride_type}</p>
                <h2>{ride.ride_name}</h2>

                <div className="purchase-divider" />

                <ul className="purchase-feature-list">
                  <li className="purchase-feature-item">
                    <span className="purchase-check" aria-hidden="true" />
                    <span>Minimum height: {ride.min_height_ft} ft</span>
                  </li>
                  <li className="purchase-feature-item">
                    <span className="purchase-check" aria-hidden="true" />
                    <span>Top speed: {ride.speed_mph} mph</span>
                  </li>
                  <li className="purchase-feature-item">
                    <span className="purchase-check" aria-hidden="true" />
                    <span>
                      Status:{' '}
                      <span
                        style={{
                          ...getStatusPillStyle(ride.status_ride),
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 6,
                          padding: '2px 10px',
                          borderRadius: 999,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {formatRideStatus(ride.status_ride)}
                      </span>
                    </span>
                  </li>
                </ul>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default RidesPage