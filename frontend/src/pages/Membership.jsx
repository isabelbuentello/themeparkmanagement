import { useState } from 'react'
import { useEffect } from 'react'
import { getMemberships } from '../api/memberships'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'
import useCustomer from '../hooks/useCustomer'

function MembershipPage() {
  const {
    cartItems,
    removeFromCart,
    selectedMembershipId,
    setMembershipInCart,
    setSelectedMembershipId
  } = useCustomer()
  const [selectedDetails, setSelectedDetails] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const membershipInCart = cartItems.find((item) => item.kind === 'membership')

  useEffect(() => {
    let isMounted = true

    const loadMemberships = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const membershipOptions = await getMemberships()

        if (isMounted) {
          setMemberships(membershipOptions)
        }
      } catch {
        if (isMounted) {
          setLoadError('Unable to load membership options right now.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadMemberships()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page">
      <PageHero
        title="Memberships"
      />

      <section className="purchase-grid">
        <AsyncState
          isLoading={isLoading}
          error={loadError}
          isEmpty={!isLoading && !loadError && memberships.length === 0}
          loadingMessage="Loading membership options..."
          emptyMessage="No memberships are available right now."
        />
        {memberships.map((membership, index) => {
          const isSelected =
            membership.id === selectedMembershipId &&
            membershipInCart?.productId === membership.id

          return (
            <article
              key={membership.id}
              className={`purchase-card membership-card${
                index === 0 ? ' purchase-card-featured' : ''
              }${
                isSelected ? ' content-card-selected' : ''
              }`}
            >
              <p className="purchase-type">{membership.visitProfile}</p>
              <h2>{membership.name}</h2>
              <p className="purchase-description">{membership.spotlight}</p>

              <div className="purchase-price-row">
                <span className="purchase-price">
                  {membership.price.replace('/month', '')}
                </span>
                <span className="purchase-unit">/month</span>
              </div>

              <div className="purchase-divider" />

              <ul className="purchase-feature-list">
                {membership.perks.map((perk) => (
                  <li key={perk} className="purchase-feature-item">
                    <span className="purchase-check" aria-hidden="true" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="purchase-button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedDetails(membership)
                    return
                  }

                  setSelectedMembershipId(membership.id)
                  setMembershipInCart(membership.id)
                }}
              >
                {isSelected ? 'View selected' : 'Select'}
              </button>
            </article>
          )
        })}
      </section>

      {selectedDetails ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedDetails(null)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${selectedDetails.id}-membership-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="purchase-type">Membership selected</p>
                <h2 id={`${selectedDetails.id}-membership-title`}>
                  {selectedDetails.name}
                </h2>
              </div>
              <button
                type="button"
                className="text-link"
                onClick={() => setSelectedDetails(null)}
              >
                Close
              </button>
            </div>

            <p className="modal-description">
              This membership is currently selected and already in your cart.
              If you choose a different membership, it will replace this one
              automatically.
            </p>

            <article className="content-card">
              <div className="metric-row">
                <div>
                  <span className="metric-value">{selectedDetails.price}</span>
                  <span className="metric-label">Monthly price</span>
                </div>
                <div>
                  <span className="metric-value">{selectedDetails.annualValue}</span>
                  <span className="metric-label">Estimated annual value</span>
                </div>
              </div>
              <p>{selectedDetails.spotlight}</p>
            </article>

            <article className="content-card">
              <p className="section-label">Included perks</p>
              <ul className="detail-list">
                {selectedDetails.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            </article>

            <button
              type="button"
              className="text-link"
              onClick={() => {
                removeFromCart(selectedDetails.id, 'membership')
                setSelectedDetails(null)
              }}
            >
              Remove membership from cart
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MembershipPage
