import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getQueueAttractions } from '../api/queue'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'
import useCustomer from '../hooks/useCustomer'

function QueuePage() {
  const { activeQueueEntry, joinQueue, leaveQueue } = useCustomer()
  const navigate = useNavigate()
  const [attractions, setAttractions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submittingAttractionId, setSubmittingAttractionId] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadAttractions = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const attractionOptions = await getQueueAttractions()

        if (isMounted) {
          setAttractions(attractionOptions)
        }
      } catch {
        if (isMounted) {
          setLoadError('Unable to load virtual queue attractions right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAttractions()

    return () => {
      isMounted = false
    }
  }, [])

  const handleQueueAction = async (attraction, isActive) => {
    setSubmittingAttractionId(attraction.id)

    try {
      if (isActive) {
        await leaveQueue()
        return
      }

      await joinQueue(attraction)
      navigate('/queue/summary')
    } finally {
      setSubmittingAttractionId('')
    }
  }

  return (
    <div className="page">
      <PageHero
        title="Virtual queue"
      />

      <section className="purchase-grid">
        <AsyncState
          isLoading={isLoading}
          error={loadError}
          isEmpty={!isLoading && !loadError && attractions.length === 0}
          loadingMessage="Loading queue availability..."
          emptyMessage="No queue-enabled attractions are available right now."
        />
        {attractions.map((attraction, index) => {
          const isUnavailable = attraction.status === 'Full'
          const isActive = activeQueueEntry?.attractionId === attraction.id
          const isSubmitting = submittingAttractionId === attraction.id

          return (
            <article
              key={attraction.id}
              className={`purchase-card${index === 0 ? ' purchase-card-featured' : ''}`}
            >
              <p className="purchase-type">{attraction.location}</p>
              <h2>{attraction.name}</h2>
              <p className="purchase-description">{attraction.description}</p>
              <div className="purchase-divider" />
              <ul className="purchase-feature-list">
                <li className="purchase-feature-item">
                  <span className="purchase-check" aria-hidden="true" />
                  <span>Thrill level: {attraction.thrillLevel}</span>
                </li>
                <li className="purchase-feature-item">
                  <span className="purchase-check" aria-hidden="true" />
                  <span>Wait time: {attraction.waitTime}</span>
                </li>
                <li className="purchase-feature-item">
                  <span className="purchase-check" aria-hidden="true" />
                  <span>Return window: {attraction.returnWindow}</span>
                </li>
              </ul>
              <button
                type="button"
                className="purchase-button"
                disabled={
                  isUnavailable ||
                  (!!activeQueueEntry && !isActive) ||
                  Boolean(submittingAttractionId)
                }
                onClick={() => handleQueueAction(attraction, isActive)}
              >
                {isSubmitting
                  ? 'Updating...'
                  : isActive
                  ? 'Leave Queue'
                  : activeQueueEntry
                    ? 'One Queue Active'
                    : isUnavailable
                      ? 'Queue Full'
                      : 'Select'}
              </button>
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default QueuePage
