import { useState, useEffect } from 'react'

function RevenueStats({ token }) {
  const [revenue, setRevenue] = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [view, setView] = useState('daily')

  const fetchRevenue = async () => {
    try {
      let url = '/api/gm/revenue'
      const params = []
      if (startDate) params.push(`start=${startDate}`)
      if (endDate) params.push(`end=${endDate}`)
      if (params.length) url += '?' + params.join('&')

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setRevenue(await res.json())
    } catch (err) { console.error('Error fetching revenue') }
  }

  const fetchBreakdown = async () => {
    try {
      let url = '/api/gm/revenue/breakdown'
      const params = []
      if (startDate) params.push(`start=${startDate}`)
      if (endDate) params.push(`end=${endDate}`)
      if (params.length) url += '?' + params.join('&')

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setBreakdown(await res.json())
    } catch (err) { console.error('Error fetching revenue breakdown') }
  }

  useEffect(() => {
    fetchRevenue()
    fetchBreakdown()
  }, [])

  const handleFilter = () => {
    fetchRevenue()
    fetchBreakdown()
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h3 className="gm-section-title">Revenue</h3>

      <div className="gm-form-card">
        <div className="gm-form-row">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
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
        </div>
      </div>

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
    </div>
  )
}

export default RevenueStats