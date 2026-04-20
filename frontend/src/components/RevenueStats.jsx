import { useState, useEffect } from 'react'

function RevenueStats({ token }) {
  const [revenue, setRevenue] = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [tickets, setTickets] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedMonthNum, setSelectedMonthNum] = useState('')
  const [selectedVenues, setSelectedVenues] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [venues, setVenues] = useState([])
  const [view, setView] = useState('daily')
  const [filterApplied, setFilterApplied] = useState(false)

  const itemTypes = [
    { value: 'ticket', label: 'Tickets' },
    { value: 'pass', label: 'Passes' },
    { value: 'other', label: 'Memberships' }
  ]

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let y = currentYear; y >= 2020; y--) {
      years.push(y.toString())
    }
    return years
  }

  const updateDateRange = (year, month) => {
    if (!year) {
      setStartDate('')
      setEndDate('')
      return
    }
    if (month) {
      setStartDate(`${year}-${month}-01`)
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      setEndDate(`${year}-${month}-${lastDay}`)
    } else {
      setStartDate(`${year}-01-01`)
      setEndDate(`${year}-12-31`)
    }
  }

  const handleYearChange = (e) => {
    const year = e.target.value
    setSelectedYear(year)
    setFilterApplied(false)
    if (!year) {
      setSelectedMonthNum('')
      updateDateRange('', '')
    } else {
      updateDateRange(year, selectedMonthNum)
    }
  }

  const handleMonthChange = (e) => {
    const month = e.target.value
    setSelectedMonthNum(month)
    setFilterApplied(false)
    updateDateRange(selectedYear, month)
  }

  const toggleVenue = (venueId) => {
    setFilterApplied(false)
    setSelectedVenues(prev =>
      prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    )
  }

  const toggleType = (type) => {
    setFilterApplied(false)
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const buildParams = () => {
    const params = []
    if (startDate) params.push(`start=${startDate}`)
    if (endDate) params.push(`end=${endDate}`)
    if (selectedVenues.length > 0) params.push(`venue=${selectedVenues.join(',')}`)
    if (selectedTypes.length > 0) params.push(`types=${selectedTypes.join(',')}`)
    return params.length ? '?' + params.join('&') : ''
  }

  const fetchRevenue = async () => {
    try {
      const res = await fetch(`/api/gm/revenue${buildParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setRevenue(await res.json())
    } catch (err) { console.error('Error fetching revenue') }
  }

  const fetchBreakdown = async () => {
    try {
      const res = await fetch(`/api/gm/revenue/breakdown${buildParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setBreakdown(await res.json())
    } catch (err) { console.error('Error fetching revenue breakdown') }
  }

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/gm/revenue/tickets${buildParams()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setTickets(await res.json())
    } catch (err) { console.error('Error fetching ticket revenue') }
  }

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/gm/venues', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setVenues(await res.json())
    } catch (err) { console.error('Error fetching venues') }
  }

  useEffect(() => {
    fetchRevenue()
    fetchBreakdown()
    fetchTickets()
    fetchVenues()
  }, [])

  const handleFilter = () => {
    fetchRevenue()
    fetchBreakdown()
    fetchTickets()
    setFilterApplied(true)
    setTimeout(() => setFilterApplied(false), 3000)
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSelectedYear('')
    setSelectedMonthNum('')
    setSelectedVenues([])
    setSelectedTypes([])
    setFilterApplied(false)
    setTimeout(() => {
      fetchRevenue()
      fetchBreakdown()
      fetchTickets()
    }, 0)
  }

  const formatType = (type) => {
    if (type === 'ticket') return 'Tickets'
    if (type === 'pass') return 'Passes'
    if (type === 'other') return 'Memberships/Parking'
    return type
  }

  const fmtDollar = (val) =>
    Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const computeSummary = () => {
    if (revenue.length === 0 && breakdown.length === 0) return null

    const totalGrossRevenue = revenue.reduce((sum, r) => sum + Number(r.daily_total), 0)
    const totalMaintenanceCosts = revenue.reduce((sum, r) => sum + Number(r.maintenance_costs || 0), 0)
    const totalNetRevenue = revenue.reduce((sum, r) => sum + Number(r.net_revenue ?? (Number(r.daily_total) - Number(r.maintenance_costs || 0))), 0)
    const totalTransactions = revenue.reduce((sum, r) => sum + Number(r.transaction_count), 0)

    const byVenue = {}
    breakdown.forEach(r => {
      byVenue[r.venue_name] = (byVenue[r.venue_name] || 0) + Number(r.revenue)
    })
    const sortedVenues = Object.entries(byVenue).sort((a, b) => b[1] - a[1])
    const topVenue = sortedVenues.length > 0 ? sortedVenues[0] : null
    const bottomVenue = sortedVenues.length > 1 ? sortedVenues[sortedVenues.length - 1] : null

    const bestDay = revenue.length
      ? revenue.reduce((best, r) => Number(r.net_revenue ?? (Number(r.daily_total) - Number(r.maintenance_costs || 0))) > Number(best.net_revenue ?? (Number(best.daily_total) - Number(best.maintenance_costs || 0))) ? r : best)
      : null

    const avgDaily = revenue.length > 0 ? totalNetRevenue / revenue.length : 0

    return { totalGrossRevenue, totalMaintenanceCosts, totalNetRevenue, totalTransactions, topVenue, bottomVenue, bestDay, avgDaily }
  }

  const hasActiveFilters = startDate || endDate || selectedVenues.length > 0 || selectedTypes.length > 0

  const getDateLabel = () => {
    if (!selectedYear) return 'All Time'
    if (selectedMonthNum) {
      const monthName = months.find(m => m.value === selectedMonthNum)?.label
      return `${monthName} ${selectedYear}`
    }
    return selectedYear
  }

  // count total active filters
  const activeFilterCount = (selectedYear ? 1 : 0) + (selectedMonthNum ? 1 : 0) +
    selectedVenues.length + selectedTypes.length +
    (startDate && !selectedYear ? 1 : 0) + (endDate && !selectedYear ? 1 : 0)

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h3 className="gm-section-title">Revenue</h3>

      {/* ---- FILTERS ---- */}
      <div className="gm-form-card">
        {/* Date period row */}
        <div className="rev-period-row">
          <div className="rev-period-group">
            <div className="rev-filter-field">
              <label className="rev-filter-label">Year</label>
              <div className="rev-select-wrapper">
                <select className="rev-select" value={selectedYear} onChange={handleYearChange}>
                  <option value="">All Time</option>
                  {getYearOptions().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="rev-select-arrow">&#9662;</span>
              </div>
            </div>
            <div className="rev-filter-field">
              <label className="rev-filter-label">Month</label>
              <div className="rev-select-wrapper">
                <select
                  className="rev-select"
                  value={selectedMonthNum}
                  onChange={handleMonthChange}
                  disabled={!selectedYear}
                >
                  <option value="">{selectedYear ? 'Full Year' : '—'}</option>
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <span className="rev-select-arrow">&#9662;</span>
              </div>
            </div>
          </div>

          <div className="rev-period-divider" />

          <div className="rev-period-group">
            <div className="rev-filter-field">
              <label className="rev-filter-label">Custom Start</label>
              <input
                className="rev-input"
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  setSelectedYear('')
                  setSelectedMonthNum('')
                  setFilterApplied(false)
                }}
              />
            </div>
            <div className="rev-filter-field">
              <label className="rev-filter-label">Custom End</label>
              <input
                className="rev-input"
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value)
                  setSelectedYear('')
                  setSelectedMonthNum('')
                  setFilterApplied(false)
                }}
              />
            </div>
          </div>

          <div className="rev-filter-actions">
            <button className="rev-apply-btn" onClick={handleFilter}>
              {filterApplied ? '✓ Applied' : 'Apply'}
            </button>
            {hasActiveFilters && (
              <button className="rev-clear-btn" onClick={handleClearFilters}>Clear</button>
            )}
          </div>
        </div>

        {/* Active filter status */}
        <div className="rev-status-bar">
          <span className={`rev-active-period ${filterApplied ? 'rev-applied' : ''}`}>
            Showing: <strong>{getDateLabel()}</strong>
          </span>
          {activeFilterCount > 0 && (
            <span className="rev-filter-count">{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>
          )}
          {filterApplied && (
            <span className="rev-applied-badge">✓ Filters applied</span>
          )}
        </div>

        {/* Venue toggles */}
        <div className="rev-toggle-section">
          <label className="rev-filter-label">Venues</label>
          <div className="rev-chip-group">
            {venues.map(v => (
              <button
                key={v.venue_id}
                className={`rev-chip ${selectedVenues.includes(v.venue_id) ? 'active' : ''}`}
                onClick={() => toggleVenue(v.venue_id)}
              >
                {v.venue_name}
              </button>
            ))}
            {venues.length === 0 && (
              <span className="rev-chip-empty">Loading venues...</span>
            )}
          </div>
        </div>

        {/* Item type toggles */}
        <div className="rev-toggle-section">
          <label className="rev-filter-label">Transaction Type</label>
          <div className="rev-chip-group">
            {itemTypes.map(t => (
              <button
                key={t.value}
                className={`rev-chip ${selectedTypes.includes(t.value) ? 'active' : ''}`}
                onClick={() => toggleType(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* View tabs */}
        <div className="rev-view-tabs">
          <button
            className={`gm-toggle-btn ${view === 'daily' ? 'active' : ''}`}
            onClick={() => setView('daily')}>
            Daily Totals
          </button>
          <button
            className={`gm-toggle-btn ${view === 'breakdown' ? 'active' : ''}`}
            onClick={() => setView('breakdown')}>
            By Venue
          </button>
          <button
            className={`gm-toggle-btn ${view === 'tickets' ? 'active' : ''}`}
            onClick={() => setView('tickets')}>
            Tickets &amp; Passes
          </button>
        </div>
      </div>

      {/* ---- SUMMARY CARDS ---- */}
      {(() => {
        const summary = computeSummary()
        if (!summary) return null
        return (
          <div className="rev-summary-grid">
            <div className="rev-summary-card">
              <span className="rev-summary-label">Total Revenue (Net)</span>
              <span className="rev-summary-value rev-summary-green">${fmtDollar(summary.totalNetRevenue)}</span>
            </div>
            <div className="rev-summary-card">
              <span className="rev-summary-label">Maintenance Costs</span>
              <span className="rev-summary-value">${fmtDollar(summary.totalMaintenanceCosts)}</span>
            </div>
            <div className="rev-summary-card">
              <span className="rev-summary-label">Gross Revenue</span>
              <span className="rev-summary-value">${fmtDollar(summary.totalGrossRevenue)}</span>
            </div>
            <div className="rev-summary-card">
              <span className="rev-summary-label">Transactions</span>
              <span className="rev-summary-value">{summary.totalTransactions.toLocaleString()}</span>
            </div>
            <div className="rev-summary-card">
              <span className="rev-summary-label">Avg Daily Net</span>
              <span className="rev-summary-value">${fmtDollar(summary.avgDaily)}</span>
            </div>
            {summary.bestDay && (
              <div className="rev-summary-card">
                <span className="rev-summary-label">Best Day</span>
                <span className="rev-summary-value">{new Date(summary.bestDay.revenue_date).toLocaleDateString()}</span>
                <span className="rev-summary-sub">${fmtDollar(summary.bestDay.net_revenue ?? (Number(summary.bestDay.daily_total) - Number(summary.bestDay.maintenance_costs || 0)))}</span>
              </div>
            )}
            {summary.topVenue && (
              <div className="rev-summary-card rev-summary-highlight">
                <span className="rev-summary-label">Top Venue</span>
                <span className="rev-summary-value">{summary.topVenue[0]}</span>
                <span className="rev-summary-sub">${fmtDollar(summary.topVenue[1])}</span>
              </div>
            )}
            {summary.bottomVenue && (
              <div className="rev-summary-card">
                <span className="rev-summary-label">Lowest Venue</span>
                <span className="rev-summary-value">{summary.bottomVenue[0]}</span>
                <span className="rev-summary-sub">${fmtDollar(summary.bottomVenue[1])}</span>
              </div>
            )}
          </div>
        )
      })()}

      {/* ---- TABLES ---- */}
      {view === 'daily' && (
        <div className="gm-table-wrapper">
          <table className="gm-table">
            <thead>
              <tr><th>Date</th><th>Revenue Total (Net)</th><th>Maintenance Costs</th><th>Gross Revenue</th><th>Transactions</th></tr>
            </thead>
            <tbody>
              {revenue.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.revenue_date).toLocaleDateString()}</td>
                  <td>${fmtDollar(r.net_revenue ?? (Number(r.daily_total) - Number(r.maintenance_costs || 0)))}</td>
                  <td>${fmtDollar(r.maintenance_costs || 0)}</td>
                  <td>${fmtDollar(r.daily_total)}</td>
                  <td>{r.transaction_count}</td>
                </tr>
              ))}
              {revenue.length === 0 && (
                <tr><td colSpan="5" className="rev-empty-row">No revenue data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === 'breakdown' && (
        <div className="gm-table-wrapper">
          <table className="gm-table">
            <thead>
              <tr><th>Date</th><th>Venue</th><th>Type</th><th>Revenue</th></tr>
            </thead>
            <tbody>
              {breakdown.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.date_of_revenue).toLocaleDateString()}</td>
                  <td>{r.venue_name}</td>
                  <td>{r.venue_type}</td>
                  <td>${fmtDollar(r.revenue)}</td>
                </tr>
              ))}
              {breakdown.length === 0 && (
                <tr><td colSpan="4" className="rev-empty-row">No venue revenue data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === 'tickets' && (
        <div className="gm-table-wrapper">
          <table className="gm-table">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Revenue</th><th>Transactions</th></tr>
            </thead>
            <tbody>
              {tickets.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.revenue_date).toLocaleDateString()}</td>
                  <td>{formatType(r.item_type)}</td>
                  <td>${fmtDollar(r.revenue)}</td>
                  <td>{r.transaction_count}</td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan="4" className="rev-empty-row">No ticket/pass revenue data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RevenueStats