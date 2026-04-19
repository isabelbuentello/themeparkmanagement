import { useState, useEffect } from 'react'

function RevenueStats({ token }) {
  const [revenue, setRevenue] = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [tickets, setTickets] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedVenue, setSelectedVenue] = useState('')
  const [venues, setVenues] = useState([])          
  const [view, setView] = useState('daily')

  const handleMonthChange = (e) => {
    const val = e.target.value
    setSelectedMonth(val)
    if (val) {
      const [year, month] = val.split('-')
      setStartDate(`${year}-${month}-01`)
      const lastDay = new Date(year, month, 0).getDate()
      setEndDate(`${year}-${month}-${lastDay}`)
    } else {
      setStartDate('')
      setEndDate('')
    }
  }

  // now includes venue param
  const buildParams = () => {
    const params = []
    if (startDate) params.push(`start=${startDate}`)
    if (endDate) params.push(`end=${endDate}`)
    if (selectedVenue) params.push(`venue=${selectedVenue}`)
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

  // fetch venue list from backend for the dropdown
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
    fetchVenues()       // load venues on mount
  }, [])

  const handleFilter = () => {
    fetchRevenue()
    fetchBreakdown()
    fetchTickets()
  }

  const formatType = (type) => {
    if (type === 'ticket') return 'Tickets'
    if (type === 'pass') return 'Passes'
    if (type === 'other') return 'Memberships/Parking'
    return type
  }

  // compute summary stats from the filtered data
  const computeSummary = () => {
    if (revenue.length === 0 && breakdown.length === 0) return null

    const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.daily_total), 0)
    const totalTransactions = revenue.reduce((sum, r) => sum + Number(r.transaction_count), 0)

    // revenue by venue
    const byVenue = {}
    breakdown.forEach(r => {
      byVenue[r.venue_name] = (byVenue[r.venue_name] || 0) + Number(r.revenue)
    })
    const sortedVenues = Object.entries(byVenue).sort((a, b) => b[1] - a[1])
    const topVenue = sortedVenues.length > 0 ? sortedVenues[0] : null
    const bottomVenue = sortedVenues.length > 1 ? sortedVenues[sortedVenues.length - 1] : null

    // best day
    const bestDay = revenue.length
      ? revenue.reduce((best, r) => Number(r.daily_total) > Number(best.daily_total) ? r : best)
      : null

    // avg daily revenue
    const avgDaily = revenue.length > 0 ? totalRevenue / revenue.length : 0

    return { totalRevenue, totalTransactions, topVenue, bottomVenue, bestDay, avgDaily }
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h3 className="gm-section-title">Revenue</h3>

      {/* ---- FILTERS ---- */}
      <div className="gm-form-card">
        <div className="gm-form-row">
          {/* month picker */}
          <label>Month</label>
          <input type="month" value={selectedMonth} onChange={handleMonthChange} />

          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setSelectedMonth('') }} />
          <label>End Date</label>
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setSelectedMonth('') }} />

          {/* NEW: venue dropdown */}
          <label>Venue</label>
          <select value={selectedVenue} onChange={e => setSelectedVenue(e.target.value)}>
            <option value="">All Venues</option>
            {venues.map(v => (
              <option key={v.venue_id} value={v.venue_id}>{v.venue_name}</option>
            ))}
          </select>

          <button className="gm-submit-btn" onClick={handleFilter}>Filter</button>
        </div>
        <div className="gm-form-row">
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
            Tickets & Passes
          </button>
        </div>
      </div>

      {/* ---- SUMMARY SECTION ---- */}
      {(() => {
        const summary = computeSummary()
        if (!summary) return null
        return (
          <div className="gm-form-card" style={{ marginBottom: '1rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Summary</h4>
            <p><strong>Total Revenue:</strong> ${summary.totalRevenue.toFixed(2)}</p>
            <p><strong>Total Transactions:</strong> {summary.totalTransactions}</p>
            <p><strong>Avg Daily Revenue:</strong> ${summary.avgDaily.toFixed(2)}</p>
            {summary.topVenue && (
              <p><strong>Top Venue:</strong> {summary.topVenue[0]} — ${summary.topVenue[1].toFixed(2)}</p>
            )}
            {summary.bottomVenue && (
              <p><strong>Lowest Venue:</strong> {summary.bottomVenue[0]} — ${summary.bottomVenue[1].toFixed(2)}</p>
            )}
            {summary.bestDay && (
              <p><strong>Best Day:</strong> {new Date(summary.bestDay.revenue_date).toLocaleDateString()} — ${Number(summary.bestDay.daily_total).toFixed(2)}</p>
            )}
          </div>
        )
      })()}

      {/* ---- TABLES  ---- */}
      {view === 'daily' && (
        <div className="gm-table-wrapper">
          <table className="gm-table">
            <thead>
              <tr><th>Date</th><th>Total Revenue</th><th>Transactions</th></tr>
            </thead>
            <tbody>
              {revenue.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.revenue_date).toLocaleDateString()}</td>
                  <td>${Number(r.daily_total).toFixed(2)}</td>
                  <td>{r.transaction_count}</td>
                </tr>
              ))}
              {revenue.length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>No revenue data</td></tr>
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
                  <td>${Number(r.revenue).toFixed(2)}</td>
                </tr>
              ))}
              {breakdown.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>No venue revenue data</td></tr>
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
                  <td>${Number(r.revenue).toFixed(2)}</td>
                  <td>{r.transaction_count}</td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>No ticket/pass revenue data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RevenueStats