import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AsyncState from '../components/AsyncState'
import PageHero from '../components/PageHero'

const initialProfileState = {
  firstName: '',
  lastName: '',
  birthdate: '',
  email: '',
  phone: '',
  address: ''
}

const sections = [
  { id: 'profile', label: 'Personal Information' },
  { id: 'security', label: 'Security' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'memberships', label: 'Memberships' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'complaints', label: 'Complaints' }
]

const formatTransactionItemLabel = (item) => {
  if (item.name) {
    return item.name
  }

  if (item.type === 'ticket') return 'Ticket purchase'
  if (item.type === 'pass') return 'Pass purchase'
  if (item.type === 'other') return 'Membership purchase'
  if (item.type === 'membership') return 'Membership purchase'
  return 'Purchase item'
}

function AccountPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const canViewAccount = Boolean(token) && role === 'customer'
  const [activeSection, setActiveSection] = useState('profile')
  const [profile, setProfile] = useState(initialProfileState)
  const [history, setHistory] = useState({
    transactions: [],
    memberships: [],
    reviews: [],
    complaints: []
  })
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [securityForm, setSecurityForm] = useState({
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isSecurityLoading, setIsSecurityLoading] = useState(true)
  const [securityError, setSecurityError] = useState('')
  const [securitySaveError, setSecuritySaveError] = useState('')
  const [securityMessage, setSecurityMessage] = useState('')
  const [isSecuritySaving, setIsSecuritySaving] = useState(false)
  const [cancelingMembershipId, setCancelingMembershipId] = useState(null)
  const [membershipActionError, setMembershipActionError] = useState('')

  const buildProfileState = (data) => {
    const fullName = (data.name || '').trim()
    const [fallbackFirstName = '', ...fallbackLastNameParts] = fullName.split(' ')

    return {
      firstName: data.firstName || fallbackFirstName,
      lastName: data.lastName || fallbackLastNameParts.join(' '),
      birthdate: data.birthdate || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || ''
    }
  }

  const handleExpiredSession = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('customer-name')
    navigate('/account', {
      replace: true,
      state: { message: 'Your session expired. Please sign in again.' }
    })
  }

  useEffect(() => {
    if (!canViewAccount || !token) {
      return
    }

    let isMounted = true

    const loadProfile = async () => {
      setIsProfileLoading(true)
      setProfileError('')

      try {
        const response = await fetch('/api/customer/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()

        if (response.status === 401 || response.status === 403) {
          if (isMounted) {
            handleExpiredSession()
          }
          return
        }

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load customer profile')
        }

        if (!isMounted) {
          return
        }

        setProfile(buildProfileState(data))
        localStorage.setItem('customer-name', data.name || '')
      } catch (error) {
        if (isMounted) {
          setProfileError(error.message || 'Unable to load your account right now.')
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false)
        }
      }
    }

    const loadSecurity = async () => {
      setIsSecurityLoading(true)
      setSecurityError('')

      try {
        const response = await fetch('/api/customer/security', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()

        if (response.status === 401 || response.status === 403) {
          if (isMounted) {
            handleExpiredSession()
          }
          return
        }

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load security settings')
        }

        if (!isMounted) {
          return
        }

        setSecurityForm((currentState) => ({
          ...currentState,
          username: data.username || ''
        }))
      } catch (error) {
        if (isMounted) {
          setSecurityError(error.message || 'Unable to load security settings.')
        }
      } finally {
        if (isMounted) {
          setIsSecurityLoading(false)
        }
      }
    }

    loadProfile()
    loadSecurity()

    return () => {
      isMounted = false
    }
  }, [canViewAccount, navigate, token])

  useEffect(() => {
    if (!canViewAccount || !token || activeSection === 'profile' || hasLoadedHistory) {
      return
    }

    let isMounted = true

    const loadHistory = async () => {
      setIsHistoryLoading(true)
      setHistoryError('')

      try {
        const response = await fetch('/api/customer/history', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()

        if (response.status === 401 || response.status === 403) {
          if (isMounted) {
            handleExpiredSession()
          }
          return
        }

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load customer history')
        }

        if (!isMounted) {
          return
        }

        setHistory({
          transactions: data.transactions || [],
          memberships: data.memberships || [],
          reviews: data.reviews || [],
          complaints: data.complaints || []
        })
        setHasLoadedHistory(true)
      } catch {
        if (isMounted) {
          setHistoryError('Unable to load customer history right now.')
        }
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [activeSection, canViewAccount, hasLoadedHistory, navigate, token])

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value
    }))
    setSaveError('')
    setSaveMessage('')
  }

  const handleSecurityChange = (event) => {
    const { name, value } = event.target
    setSecurityForm((currentState) => ({
      ...currentState,
      [name]: value
    }))
    setSecuritySaveError('')
    setSecurityMessage('')
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setSaveError('')
    setSaveMessage('')

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      })

      const data = await response.json()

      if (response.status === 401 || response.status === 403) {
        handleExpiredSession()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save profile changes')
      }

      setProfile(buildProfileState(data))
      localStorage.setItem('customer-name', data.name || '')
      setSaveMessage('Your profile has been updated.')
      setIsEditingProfile(false)
    } catch (error) {
      setSaveError(error.message || 'Unable to save profile changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSecuritySave = async (event) => {
    event.preventDefault()
    setIsSecuritySaving(true)
    setSecuritySaveError('')
    setSecurityMessage('')

    try {
      const response = await fetch('/api/customer/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(securityForm)
      })

      const data = await response.json()

      if (response.status === 401 || response.status === 403) {
        handleExpiredSession()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update security settings')
      }

      setSecurityForm((currentState) => ({
        ...currentState,
        username: data.username || currentState.username,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      setSecurityMessage(data.message || 'Security settings updated.')
    } catch (error) {
      setSecuritySaveError(error.message || 'Unable to update security settings')
    } finally {
      setIsSecuritySaving(false)
    }
  }

  const handleCancelMembership = async (membershipId) => {
    const confirmed = window.confirm('Cancel this membership? This keeps the record for your account history.')

    if (!confirmed) {
      return
    }

    setCancelingMembershipId(membershipId)
    setMembershipActionError('')

    try {
      const response = await fetch(`/api/customer/memberships/${membershipId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.status === 401 || response.status === 403) {
        handleExpiredSession()
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Unable to cancel membership')
      }

      setHistory((currentHistory) => ({
        ...currentHistory,
        memberships: currentHistory.memberships.map((membership) => (
          membership.membershipId === membershipId
            ? {
                ...membership,
                status: data.status || 'canceled',
                endDate: data.endDate || membership.endDate
              }
            : membership
        ))
      }))
    } catch (error) {
      setMembershipActionError(error.message || 'Unable to cancel membership')
    } finally {
      setCancelingMembershipId(null)
    }
  }

  const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`
  const formatDate = (value) => {
    if (!value) {
      return 'N/A'
    }

    const parsed = new Date(value)

    if (Number.isNaN(parsed.getTime())) {
      return String(value)
    }

    return parsed.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    })
  }
  const formatBirthdate = (value) => formatDate(value)
  const accountName = `${profile.firstName} ${profile.lastName}`.trim() || 'Customer'
  const isPasswordChangeAttempt = Boolean(
    securityForm.newPassword || securityForm.confirmPassword
  )
  const isNewPasswordLongEnough = securityForm.newPassword.length >= 8
  const doSecurityPasswordsMatch =
    !securityForm.confirmPassword || securityForm.newPassword === securityForm.confirmPassword
  const renderEmptyState = (message) => (
    <p className="muted-copy" style={{ margin: 0 }}>{message}</p>
  )

  const renderProfileSection = () => (
    <div className="account-section-card">
      <div className="account-section-header">
        <div>
          <h2 className="account-section-title">Personal Information</h2>
          <p className="account-security-subtitle">
            Review and update your contact and personal details.
          </p>
        </div>
        {!isProfileLoading && !profileError ? (
          isEditingProfile ? (
            <button
              type="button"
              className="account-edit-button account-edit-button-secondary"
              onClick={() => {
                setIsEditingProfile(false)
                setSaveError('')
                setSaveMessage('')
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              className="account-edit-button"
              onClick={() => setIsEditingProfile(true)}
            >
              Edit
            </button>
          )
        ) : null}
      </div>

      <div className="account-section-divider" />

      <AsyncState
        isLoading={isProfileLoading}
        error={profileError}
        errorMessage={profileError}
      />

      {!isProfileLoading && !profileError ? (
        <form onSubmit={handleProfileSave} className="account-security-card">
          <div className="account-security-stack">
            <label className="form-field">
              <span>First Name</span>
              <input
                type="text"
                name="firstName"
                value={profile.firstName}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                required
              />
            </label>

            <label className="form-field">
              <span>Last Name</span>
              <input
                type="text"
                name="lastName"
                value={profile.lastName}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                required
              />
            </label>

            <label className="form-field">
              <span>Date of Birth</span>
              <input
                type={isEditingProfile ? 'date' : 'text'}
                name="birthdate"
                value={
                  isEditingProfile
                    ? profile.birthdate
                    : profile.birthdate
                      ? formatBirthdate(profile.birthdate)
                      : 'Not provided'
                }
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                required
              />
            </label>

            <label className="form-field">
              <span>Email Address</span>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                required
              />
            </label>

            <label className="form-field">
              <span>Phone Number</span>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                required
              />
            </label>

            <label className="form-field">
              <span>Address</span>
              <input
                type="text"
                name="address"
                value={profile.address}
                onChange={handleProfileChange}
                disabled={!isEditingProfile}
                placeholder={isEditingProfile ? 'Optional' : ''}
              />
            </label>
          </div>

          {isEditingProfile ? (
            <div className="account-security-actions">
              <button type="submit" className="primary-btn account-submit-button" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : null}

          {saveMessage ? (
            <div className="confirmation-box">
              <strong>Saved.</strong>
              <p>{saveMessage}</p>
            </div>
          ) : null}

          <AsyncState error={saveError} errorMessage={saveError} />
        </form>
      ) : null}
    </div>
  )

  const renderTransactions = () => (
    <div className="account-section-card">
      <div>
        <h2 className="account-section-title">Transactions</h2>
        <p className="account-security-subtitle">
          Review your completed purchases and payment details.
        </p>
      </div>
      <div className="account-section-divider" />
      <AsyncState
        isLoading={isHistoryLoading}
        error={historyError}
        errorMessage={historyError}
      />
      {!isHistoryLoading && !historyError ? (
        history.transactions.length ? (
          <div className="account-stack">
            {history.transactions.map((transaction) => (
              <article key={transaction.transactionId} className="account-history-card">
                <div>
                  <strong className="account-history-title">Transaction {transaction.userTransactionNumber || transaction.transactionId}</strong>
                  <p className="account-history-meta">{formatDate(transaction.date)} · {transaction.paymentMethod}</p>
                  {transaction.items.length ? (
                    <div className="account-history-copy">
                      {transaction.items.map((item, index) => {
                        const itemLabel = formatTransactionItemLabel(item)
                        const quantity = Number(item.quantity || 0)
                        const hasUnitPrice = Number.isFinite(item.unitPrice)
                        const lineTotal = hasUnitPrice ? quantity * Number(item.unitPrice) : null

                        return (
                          <p key={`${transaction.transactionId}-${itemLabel}-${index}`} style={{ margin: '4px 0' }}>
                            {quantity} x {itemLabel}
                            {hasUnitPrice ? ` @ ${formatCurrency(item.unitPrice)} each` : ''}
                            {lineTotal !== null ? ` (${formatCurrency(lineTotal)})` : ''}
                          </p>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="account-history-copy">No item details available</p>
                  )}
                </div>
                <span className="account-history-amount">{formatCurrency(transaction.total)}</span>
              </article>
            ))}
          </div>
        ) : (
          renderEmptyState('No transactions on record.')
        )
      ) : null}
    </div>
  )

  const renderSecuritySection = () => (
    <div className="account-section-card">
      <div className="account-section-header">
        <div>
          <h2 className="account-section-title">Security</h2>
          <p className="account-security-subtitle">
            Update your username and password in one place.
          </p>
        </div>
      </div>
      <div className="account-section-divider" />

      <AsyncState
        isLoading={isSecurityLoading}
        error={securityError}
        errorMessage={securityError}
      />

      {!isSecurityLoading ? (
        <form onSubmit={handleSecuritySave} className="account-security-card">
          <div className="account-security-stack">
            <label className="form-field">
              <span>Username</span>
              <input
                type="text"
                name="username"
                value={securityForm.username}
                onChange={handleSecurityChange}
                required
              />
            </label>

            <label className="form-field">
              <span>Current Password</span>
              <input
                type="password"
                name="currentPassword"
                value={securityForm.currentPassword}
                onChange={handleSecurityChange}
                required
              />
            </label>

            <label className="form-field">
              <span>New Password</span>
              <input
                type="password"
                name="newPassword"
                value={securityForm.newPassword}
                onChange={handleSecurityChange}
              />
              {isPasswordChangeAttempt ? (
                <span className={`account-security-hint ${isNewPasswordLongEnough ? 'account-security-hint-valid' : ''}`}>
                  {isNewPasswordLongEnough
                    ? 'Password length is valid.'
                    : 'New password must be at least 8 characters long.'}
                </span>
              ) : null}
            </label>

            <label className="form-field">
              <span>Confirm New Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={securityForm.confirmPassword}
                onChange={handleSecurityChange}
              />
              {securityForm.confirmPassword ? (
                <span className={`account-security-hint ${doSecurityPasswordsMatch ? 'account-security-hint-valid' : ''}`}>
                  {doSecurityPasswordsMatch
                    ? 'Passwords match.'
                    : 'New password and confirm password must match.'}
                </span>
              ) : null}
            </label>
          </div>

          <div className="account-security-actions">
            <button
              type="submit"
              className="primary-btn account-submit-button"
              disabled={
                isSecuritySaving ||
                (isPasswordChangeAttempt && (!isNewPasswordLongEnough || !doSecurityPasswordsMatch))
              }
            >
              {isSecuritySaving ? 'Saving...' : 'Update Security'}
            </button>
          </div>

          {securitySaveError ? (
            <div className="confirmation-box">
              <strong>Something went wrong.</strong>
              <p>{securitySaveError}</p>
            </div>
          ) : null}

          {securityMessage ? (
            <div className="confirmation-box">
              <strong>Saved.</strong>
              <p>{securityMessage}</p>
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  )

  const renderMemberships = () => (
    <div className="account-section-card">
      <div>
        <h2 className="account-section-title">Memberships</h2>
        <p className="account-security-subtitle">
          Track your membership tiers, dates, and current status.
        </p>
      </div>
      <div className="account-section-divider" />
      <AsyncState
        isLoading={isHistoryLoading}
        error={historyError}
        errorMessage={historyError}
      />
      {membershipActionError ? (
        <div className="confirmation-box account-action-message">
          <strong>Something went wrong.</strong>
          <p>{membershipActionError}</p>
        </div>
      ) : null}
      {!isHistoryLoading && !historyError ? (
        history.memberships.length ? (
          <div className="account-stack">
            {history.memberships.map((membership) => (
              <article key={membership.membershipId} className="account-history-card">
                <div>
                  <strong className="account-history-title">{membership.tierName}</strong>
                  <p className="account-history-meta">{formatDate(membership.startDate)} to {formatDate(membership.endDate)}</p>
                </div>
                <div className="account-membership-actions">
                  <span className="account-history-badge">{membership.status}</span>
                  {membership.status === 'active' ? (
                    <button
                      type="button"
                      className="secondary-btn account-cancel-membership-button"
                      onClick={() => handleCancelMembership(membership.membershipId)}
                      disabled={cancelingMembershipId === membership.membershipId}
                    >
                      {cancelingMembershipId === membership.membershipId ? 'Canceling...' : 'Cancel Membership'}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          renderEmptyState('No memberships on record.')
        )
      ) : null}
    </div>
  )

  const renderReviews = () => (
    <div className="account-section-card">
      <div>
        <h2 className="account-section-title">Reviews</h2>
        <p className="account-security-subtitle">
          See the ratings and comments you have shared with the park.
        </p>
      </div>
      <div className="account-section-divider" />
      <AsyncState
        isLoading={isHistoryLoading}
        error={historyError}
        errorMessage={historyError}
      />
      {!isHistoryLoading && !historyError ? (
        history.reviews.length ? (
          <div className="account-stack">
            {history.reviews.map((review) => (
              <article key={review.reviewId} className="account-history-card">
                <div>
                  <strong className="account-history-title">{review.rating}/10</strong>
                  <p className="account-history-copy">{review.comment || 'No comment provided.'}</p>
                </div>
                <span className="account-history-meta">{formatDate(review.createdDate)}</span>
              </article>
            ))}
          </div>
        ) : (
          renderEmptyState('No reviews on record.')
        )
      ) : null}
    </div>
  )

  const renderComplaints = () => (
    <div className="account-section-card">
      <div>
        <h2 className="account-section-title">Complaints</h2>
        <p className="account-security-subtitle">
          View submitted issues and whether they are still open or resolved.
        </p>
      </div>
      <div className="account-section-divider" />
      <AsyncState
        isLoading={isHistoryLoading}
        error={historyError}
        errorMessage={historyError}
      />
      {!isHistoryLoading && !historyError ? (
        history.complaints.length ? (
          <div className="account-stack">
            {history.complaints.map((complaint) => (
              <article key={complaint.complaintId} className="account-history-card">
                <div>
                  <strong className="account-history-title">{complaint.resolved ? 'Resolved' : 'Open'}</strong>
                  <p className="account-history-copy">{complaint.description || 'No description provided.'}</p>
                </div>
                <span className="account-history-meta">{formatDate(complaint.createdDate)}</span>
              </article>
            ))}
          </div>
        ) : (
          renderEmptyState('No complaints on record.')
        )
      ) : null}
    </div>
  )

  const renderContent = () => {
    if (activeSection === 'profile') return renderProfileSection()
    if (activeSection === 'security') return renderSecuritySection()
    if (activeSection === 'transactions') return renderTransactions()
    if (activeSection === 'memberships') return renderMemberships()
    if (activeSection === 'reviews') return renderReviews()
    return renderComplaints()
  }

  if (!canViewAccount) {
    return (
      <div className="page">
        <PageHero title="Customer Account" compact />
        <section className="purchase-grid">
          <div className="async-state async-state-empty" role="status">
            <p className="async-state-label">Login required</p>
            <p className="async-state-message">
              Please sign in as a customer to view your account.
            </p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHero title="Customer Account" compact />

      <section
        className="two-column-layout account-layout"
        style={{ gridTemplateColumns: '220px minmax(0, 1fr)' }}
      >
        <aside
          className="content-card"
          style={{
            background: 'transparent',
            boxShadow: 'none',
            maxWidth: '220px',
            width: '100%'
          }}
        >
          <div style={{ display: 'grid', gap: '0.35rem', marginBottom: '1.5rem' }}>
            <strong style={{ fontSize: '1.1rem' }}>{accountName}</strong>
            <span className="muted-copy">{profile.email || 'Loading email...'}</span>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className="text-link"
                style={{
                  textAlign: 'left',
                  fontWeight: activeSection === section.id ? '700' : '400',
                  padding: 0
                }}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="content-card form-card">
          {renderContent()}
        </div>
      </section>
    </div>
  )
}

export default AccountPage
