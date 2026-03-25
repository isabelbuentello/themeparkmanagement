import { useState } from 'react'
import PageHero from '../components/PageHero'
import useCustomer from '../hooks/useCustomer'

function QueueSummaryPage() {
  const { activeQueueEntry, leaveQueue } = useCustomer()
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancel = async () => {
    setIsCancelling(true)

    try {
      await leaveQueue()
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="page">
      <PageHero
        title={
          activeQueueEntry
            ? activeQueueEntry.attractionName
            : 'Queue summary'
        }
        compact
      />

      <section className="two-column-layout">
        <article className="content-card">
          {activeQueueEntry ? (
            <>
              <div className="detail-pair-grid">
                <div>
                  <span className="detail-label">Location</span>
                  <strong>{activeQueueEntry.location}</strong>
                </div>
                <div>
                  <span className="detail-label">Return window</span>
                  <strong>{activeQueueEntry.returnWindow}</strong>
                </div>
                <div>
                  <span className="detail-label">Joined at</span>
                  <strong>
                    {new Date(activeQueueEntry.joinedAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </strong>
                </div>
              </div>
              <p className="muted-copy">
                Keep this summary open while navigating the park.
              </p>
            </>
          ) : (
            <p className="muted-copy">
              Select an attraction from the queue list to create an active entry.
            </p>
          )}
        </article>

        <aside className="content-card highlight-panel">
          <p className="section-label">Queue Controls</p>
          <h2>{activeQueueEntry ? 'Manage Reservation' : 'Nothing active'}</h2>
          <button
            type="button"
            className={`secondary-btn full-width${
              activeQueueEntry ? '' : ' button-disabled'
            }`}
            onClick={handleCancel}
            disabled={!activeQueueEntry || isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Queue Entry'}
          </button>
        </aside>
      </section>
    </div>
  )
}

export default QueueSummaryPage
