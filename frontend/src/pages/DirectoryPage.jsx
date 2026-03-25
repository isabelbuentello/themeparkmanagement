import { useState } from 'react'
import { useEffect } from 'react'
import { getDirectory } from '../api/venues'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'

function DirectoryPage({ category }) {
  const [config, setConfig] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadDirectory = async () => {
      setIsLoading(true)
      setLoadError('')
      setConfig(null)
      setSelectedItem(null)

      try {
        const directory = await getDirectory(category)

        if (isMounted) {
          setConfig(directory)
        }
      } catch {
        if (isMounted) {
          setLoadError('Unable to load this directory right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadDirectory()

    return () => {
      isMounted = false
    }
  }, [category])

  const visibleItems = config?.items ?? []

  return (
    <div className="page">
      <PageHero
        title={config?.title ?? 'Directory'}
        compact
      />

      <section className="purchase-grid">
        <AsyncState
          isLoading={isLoading}
          error={loadError}
          isEmpty={!isLoading && !loadError && visibleItems.length === 0}
          loadingMessage="Loading directory..."
          emptyMessage="No places are available in this category yet."
        />
        {visibleItems.map((item, index) => (
          <article
            key={item.id}
            className={`purchase-card${index === 0 ? ' purchase-card-featured' : ''}`}
          >
            <p className="purchase-type">{item.type}</p>
            <h2>{item.name}</h2>
            <p className="purchase-description">{item.description}</p>
            <div className="purchase-divider" />
            <ul className="purchase-feature-list">
              <li className="purchase-feature-item">
                <span className="purchase-check" aria-hidden="true" />
                <span>Location: {item.location}</span>
              </li>
              <li className="purchase-feature-item">
                <span className="purchase-check" aria-hidden="true" />
                <span>Hours: {item.hours}</span>
              </li>
              <li className="purchase-feature-item">
                <span className="purchase-check" aria-hidden="true" />
                <span>{item.highlight}</span>
              </li>
            </ul>
            <button
              type="button"
              className="text-link"
              onClick={() => setSelectedItem(item)}
            >
              View details
            </button>
          </article>
        ))}
      </section>

      {selectedItem ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${selectedItem.id}-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="purchase-type">{selectedItem.type}</p>
                <h2 id={`${selectedItem.id}-title`}>{selectedItem.name}</h2>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
            </div>

            <p className="modal-description">{selectedItem.description}</p>

            <article className="content-card">
              <p className="section-label">Good to know</p>
              <ul className="detail-list">
                {selectedItem.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </article>

            <article className="content-card">
              <div className="detail-pair-grid">
                <div>
                  <span className="detail-label">Type</span>
                  <strong>{selectedItem.type}</strong>
                </div>
                <div>
                  <span className="detail-label">Location</span>
                  <strong>{selectedItem.location}</strong>
                </div>
                <div>
                  <span className="detail-label">Hours</span>
                  <strong>{selectedItem.hours}</strong>
                </div>
                <div>
                  <span className="detail-label">Highlight</span>
                  <strong>{selectedItem.highlight}</strong>
                </div>
              </div>
            </article>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default DirectoryPage
