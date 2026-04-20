import { useEffect, useState } from 'react'

function CustomerLoyaltyReport({ token }) {
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [view, setView] = useState('longest')

  const buildParams = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (tierFilter) params.set('tier', tierFilter)
    const query = params.toString()
    return query ? `?${query}` : ''
  }

  const fetchReport = async () => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/gm/customer-loyalty${buildParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : { message: 'Customer loyalty report endpoint did not return JSON. Restart the backend server and try again.' }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load customer loyalty report')
      }

      setReport(data)
    } catch (err) {
      setError(err.message || 'Failed to load customer loyalty report')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  const formatDate = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleDateString()
  }

  const formatLabel = (value) => {
    if (!value) return '-'
    return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  const formatDuration = (days) => {
    const dayCount = Number(days || 0)
    const years = Math.floor(dayCount / 365)
    const months = Math.floor((dayCount % 365) / 30)

    if (years > 0 && months > 0) return `${years} yr ${months} mo`
    if (years > 0) return `${years} yr`
    if (months > 0) return `${months} mo`
    return `${dayCount} days`
  }

  const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`

  const summary = report?.globalSummary || report?.summary || {}
  const members = report?.members || []
  const filteredMembers = members.filter((member) => {
    const statusMatches = !statusFilter || member.status_membership === statusFilter
    const tierMatches = !tierFilter || member.tier_name === tierFilter

    return statusMatches && tierMatches
  })
  const statusOptions = ['active', 'expired', 'canceled']
  const tierOptions = ['silver', 'gold', 'platinum']
  const highestSpenders = [...filteredMembers].sort((a, b) => {
    const spentDifference = Number(b.total_spent || 0) - Number(a.total_spent || 0)
    if (spentDifference !== 0) return spentDifference
    return Number(b.transaction_count || 0) - Number(a.transaction_count || 0)
  })
  const displayedMembers = view === 'spenders' ? highestSpenders : filteredMembers
  const mostLoyalCustomer = summary.mostLoyalCustomer
  const mostActiveMembership = summary.mostActiveMembership

  const buildGroups = (type) => {
    const options = type === 'status' ? statusOptions : tierOptions
    const key = type === 'status' ? 'status_membership' : 'tier_name'

    return options.map((option) => ({
      label: option,
      members: filteredMembers.filter((member) => member[key] === option)
    }))
  }

  const statusGroups = buildGroups('status')
  const tierGroups = buildGroups('tier')

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h3 className="gm-section-title">Customer Loyalty Report</h3>

      <section className="gm-report-panel">
        <h4>Summary</h4>
        <div className="gm-report-summary">
          <div className="gm-report-card">
            <span>Total Members</span>
            <strong>{summary.totalMembers || 0}</strong>
          </div>
          <div className="gm-report-card">
            <span>Active Members</span>
            <strong>{summary.activeMembers || 0}</strong>
          </div>
          <div className="gm-report-card">
            <span>Most Active Membership</span>
            <strong>{formatLabel(mostActiveMembership?.tier)}</strong>
            {mostActiveMembership && (
              <small>
                {mostActiveMembership.active_count} active member{Number(mostActiveMembership.active_count) === 1 ? '' : 's'}
              </small>
            )}
          </div>
          <div className="gm-report-card">
            <span>Most Loyal Customer</span>
            <strong>{mostLoyalCustomer?.customer_name || '-'}</strong>
            {mostLoyalCustomer && <small>{formatDuration(mostLoyalCustomer.days_as_member)}</small>}
          </div>
        </div>
      </section>

      <section className="gm-report-panel">
        <h4>Narrow Results</h4>
        <div className="gm-form-row gm-report-controls">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="canceled">Canceled</option>
          </select>

          <label>Tier</label>
          <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
            <option value="">All tiers</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>
      </section>

      <section className="gm-report-panel">
        <div className="gm-report-panel-header">
          <h4>Results</h4>
          <div className="gm-report-view-actions">
            <button
              className={`gm-toggle-btn gm-report-action-btn ${view === 'longest' ? 'active' : ''}`}
              onClick={() => setView('longest')}
            >
              Longest Members
            </button>
            <button
              className={`gm-toggle-btn gm-report-action-btn ${view === 'spenders' ? 'active' : ''}`}
              onClick={() => setView('spenders')}
            >
              Highest Spenders
            </button>
            <button
              className={`gm-toggle-btn gm-report-action-btn ${view === 'status' ? 'active' : ''}`}
              onClick={() => setView('status')}
            >
              By Status
            </button>
            <button
              className={`gm-toggle-btn gm-report-action-btn ${view === 'tier' ? 'active' : ''}`}
              onClick={() => setView('tier')}
            >
              By Tier
            </button>
          </div>
        </div>

        {isLoading && <div className="gm-form-card">Loading customer loyalty report...</div>}
        {error && <div className="gm-form-card gm-report-error">{error}</div>}

        {!isLoading && !error && (view === 'longest' || view === 'spenders') && (
          <div className="gm-table-wrapper">
            <table className="gm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>How Long</th>
                  <th>Total Spent</th>
                  <th>Auto Renew</th>
                </tr>
              </thead>
              <tbody>
                {displayedMembers.map((member) => (
                  <tr key={member.membership_id}>
                    <td>{member.customer_name}</td>
                    <td>{member.customer_email}</td>
                    <td>{member.username}</td>
                    <td>{formatLabel(member.tier_name)}</td>
                    <td>{formatLabel(member.status_membership)}</td>
                    <td>{formatDate(member.start_date)}</td>
                    <td>{formatDate(member.end_date)}</td>
                    <td>{formatDuration(member.days_as_member)}</td>
                    <td>{formatMoney(member.total_spent)}</td>
                    <td>{member.auto_renew ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {displayedMembers.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center' }}>No memberships found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && view === 'status' && (
          <div className="gm-group-list">
            {statusGroups.map((group) => (
              <section key={group.label} className="gm-group-card">
                <div className="gm-group-card-header">
                  <h5>{formatLabel(group.label)}</h5>
                  <span>{group.members.length} member{group.members.length === 1 ? '' : 's'}</span>
                </div>
                {group.members.length ? (
                  <ul>
                    {group.members.map((member) => (
                      <li key={member.membership_id}>
                        <strong>{member.customer_name}</strong>
                        <span>{formatLabel(member.tier_name)} - {formatDuration(member.days_as_member)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No members found</p>
                )}
              </section>
            ))}
          </div>
        )}

        {!isLoading && !error && view === 'tier' && (
          <div className="gm-group-list">
            {tierGroups.map((group) => (
              <section key={group.label} className="gm-group-card">
                <div className="gm-group-card-header">
                  <h5>{formatLabel(group.label)}</h5>
                  <span>{group.members.length} member{group.members.length === 1 ? '' : 's'}</span>
                </div>
                {group.members.length ? (
                  <ul>
                    {group.members.map((member) => (
                      <li key={member.membership_id}>
                        <strong>{member.customer_name}</strong>
                        <span>{formatLabel(member.status_membership)} - {formatDuration(member.days_as_member)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No members found</p>
                )}
              </section>
            ))}
          </div>
        )}

      </section>
    </div>
  )
}

export default CustomerLoyaltyReport
