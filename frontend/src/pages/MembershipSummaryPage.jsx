import { useEffect, useState } from 'react'
import { getMemberships } from '../api/memberships'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'
import useCustomer from '../hooks/useCustomer'

function MembershipSummaryPage() {
  const { selectedMembershipId } = useCustomer()
  const [memberships, setMemberships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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
          setLoadError('Unable to load membership details right now.')
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

  const activeMembership =
    memberships.find((membership) => membership.id === selectedMembershipId) ??
    memberships[0]

  return (
    <div className="page">
      <PageHero
        title={activeMembership?.name ?? 'Membership summary'}
        compact
      />

      <AsyncState
        isLoading={isLoading}
        error={loadError}
        isEmpty={!isLoading && !loadError && !activeMembership}
        loadingMessage="Loading membership details..."
        emptyMessage="Select a membership to view its perks."
      />

      {activeMembership ? (
      <section className="two-column-layout">
        <article className="content-card">
          <div className="metric-row">
            <div>
              <span className="metric-value">{activeMembership.price}</span>
              <span className="metric-label">Monthly price</span>
            </div>
            <div>
              <span className="metric-value">{activeMembership.annualValue}</span>
              <span className="metric-label">Estimated annual value</span>
            </div>
          </div>
          <p>{activeMembership.spotlight}</p>
        </article>

        <aside className="content-card highlight-panel">
          <p className="section-label">Included Perks</p>
          <h2>{activeMembership.visitProfile}</h2>
          <ul className="detail-list">
            {activeMembership.perks.map((perk) => (
              <li key={perk}>{perk}</li>
            ))}
          </ul>
        </aside>
      </section>
      ) : null}
    </div>
  )
}

export default MembershipSummaryPage
