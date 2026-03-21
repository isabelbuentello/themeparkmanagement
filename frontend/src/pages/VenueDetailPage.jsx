import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getVenueById } from '../api/venues'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'

function VenueDetailPage({ category }) {
  const { itemId } = useParams()
  const [config, setConfig] = useState(null)
  const [item, setItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadVenue = async () => {
      setIsLoading(true)
      setConfig(null)
      setItem(null)

      try {
        const venue = await getVenueById(category, itemId)

        if (isMounted) {
          setConfig(venue.config)
          setItem(venue.item)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadVenue()

    return () => {
      isMounted = false
    }
  }, [category, itemId])

  if (isLoading) {
    return (
      <div className="page">
        <PageHero
          title="Loading venue"
          compact
        />
        <AsyncState isLoading loadingMessage="Loading venue details..." />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="page">
        <PageHero
          title="Page not found"
          compact
        />
        <Link to={`/${category}`} className="text-link">
          Back To {config?.title ?? 'Directory'}
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHero
        title={item.name}
      />

      <section className="page-detail-stack">
        <article className="content-card">
          <p className="section-label">Read-Only Information</p>
          <h2>What Guests Should Know</h2>
          <ul className="detail-list">
            {item.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </article>

        <article className="content-card">
          <div className="detail-pair-grid">
            <div>
              <span className="detail-label">Type</span>
              <strong>{item.type}</strong>
            </div>
            <div>
              <span className="detail-label">Location</span>
              <strong>{item.location}</strong>
            </div>
            <div>
              <span className="detail-label">Hours / times</span>
              <strong>{item.hours}</strong>
            </div>
            <div>
              <span className="detail-label">Standout note</span>
              <strong>{item.highlight}</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}

export default VenueDetailPage
