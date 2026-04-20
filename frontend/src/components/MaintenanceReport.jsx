import { useEffect, useState } from 'react'

function MaintenanceReport({ token }) {
  const [ridesOptions, setRidesOptions] = useState([])
  const [reportStart, setReportStart] = useState('')
  const [reportEnd, setReportEnd] = useState('')
  const [reportMonth, setReportMonth] = useState('all')
  const [reportYear, setReportYear] = useState('all')
  const [selectedRideTypes, setSelectedRideTypes] = useState([])
  const [selectedRideIds, setSelectedRideIds] = useState([])
  const [reportPriorityFilter, setReportPriorityFilter] = useState('all')
  const [reportData, setReportData] = useState({
    summary: null,
    mostMaintenancedRide: null,
    frequencyByRide: [],
    frequencyByDay: [],
    records: []
  })
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [reportTableView, setReportTableView] = useState('records')

  const authHeaders = { Authorization: `Bearer ${token}` }

  const buildUrlWithParams = (basePath, params) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') searchParams.set(key, value)
    })
    const queryText = searchParams.toString()
    return queryText ? `${basePath}?${queryText}` : basePath
  }

  const handleResponse = async (res) => {
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Request failed')
    return data
  }

  const formatMinutes = (minutes) => {
    const parsedMinutes = Number(minutes)
    if (!Number.isFinite(parsedMinutes) || parsedMinutes < 0) return 'Not resolved'
    const roundedMinutes = Math.round(parsedMinutes)
    const days = Math.floor(roundedMinutes / (24 * 60))
    const hours = Math.floor((roundedMinutes % (24 * 60)) / 60)
    const remainingMinutes = roundedMinutes % 60
    if (days > 0) return `${days}d ${hours}h ${remainingMinutes}m`
    if (hours > 0) return `${hours}h ${remainingMinutes}m`
    return `${remainingMinutes}m`
  }

  const formatStatusLabel = (value) => String(value || '').replaceAll('_', ' ')

  const loadRides = async () => {
    try {
      const ridesRes = await fetch('/api/rides/all', { headers: authHeaders })
      const ridesData = await handleResponse(ridesRes)
      setRidesOptions(ridesData)
    } catch {
      setRidesOptions([])
    }
  }

  const loadReport = async () => {
    setReportLoading(true)
    setReportError('')
    try {
      const response = await fetch(
        buildUrlWithParams('/api/maintenance/report', {
          start: reportStart,
          end: reportEnd,
          month: reportMonth,
          year: reportYear,
          priority: reportPriorityFilter
        }),
        { headers: authHeaders }
      )
      const data = await handleResponse(response)
      setReportData({
        summary: data.summary || null,
        mostMaintenancedRide: data.mostMaintenancedRide || null,
        frequencyByRide: data.frequencyByRide || [],
        frequencyByDay: data.frequencyByDay || [],
        records: data.records || []
      })
    } catch (err) {
      setReportError(err.message || 'Failed to load maintenance report')
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    loadRides()
    loadReport()
  }, [])

  const toggleRideFilter = (rideId) => {
    const rideKey = String(rideId)
    setSelectedRideIds((current) =>
      current.includes(rideKey)
        ? current.filter((id) => id !== rideKey)
        : [...current, rideKey]
    )
  }

  const toggleRideTypeFilter = (rideType) => {
    setSelectedRideTypes((current) =>
      current.includes(rideType)
        ? current.filter((type) => type !== rideType)
        : [...current, rideType]
    )
  }

  const clearFilters = () => {
    setReportStart('')
    setReportEnd('')
    setReportMonth('all')
    setReportYear('all')
    setReportPriorityFilter('all')
    setSelectedRideTypes([])
    setSelectedRideIds([])

    // Clear server-side filters immediately and then apply client-side defaults.
    setTimeout(() => {
      loadReport()
    }, 0)
  }

  const selectedRideTypeSet = new Set(selectedRideTypes)
  const rideTypeOptions = Array.from(new Set(ridesOptions.map((ride) => ride.ride_type).filter(Boolean))).sort()

  const visibleRides = selectedRideTypes.length
    ? ridesOptions.filter((ride) => selectedRideTypeSet.has(ride.ride_type))
    : ridesOptions

  const ridesById = ridesOptions.reduce((map, ride) => {
    map[String(ride.ride_id)] = ride
    return map
  }, {})

  const effectiveRideIdSet = new Set()
  const hasRideFiltering = selectedRideIds.length > 0 || selectedRideTypes.length > 0

  if (selectedRideIds.length > 0) {
    selectedRideIds.forEach((rideId) => {
      const ride = ridesById[rideId]
      if (!ride) return
      if (selectedRideTypes.length > 0 && !selectedRideTypeSet.has(ride.ride_type)) return
      effectiveRideIdSet.add(rideId)
    })
  } else if (selectedRideTypes.length > 0) {
    visibleRides.forEach((ride) => {
      effectiveRideIdSet.add(String(ride.ride_id))
    })
  }

  const records = hasRideFiltering
    ? reportData.records.filter((row) => effectiveRideIdSet.has(String(row.ride_id)))
    : reportData.records

  const frequencyByRide = hasRideFiltering
    ? reportData.frequencyByRide.filter((row) => effectiveRideIdSet.has(String(row.ride_id)))
    : reportData.frequencyByRide

  const frequencyByDayMap = records.reduce((acc, row) => {
    const dayKey = row.created_time ? row.created_time.slice(0, 10) : ''
    if (!dayKey) return acc

    if (!acc[dayKey]) {
      acc[dayKey] = {
        maintenance_date: dayKey,
        maintenance_count: 0,
        total_spent: 0
      }
    }

    acc[dayKey].maintenance_count += 1
    acc[dayKey].total_spent += Number(row.cost_to_repair || 0)
    return acc
  }, {})

  const frequencyByDay = Object.values(frequencyByDayMap).sort(
    (a, b) => new Date(b.maintenance_date) - new Date(a.maintenance_date)
  )

  const resolvedRecords = records.filter((row) => row.status_request === 'resolved' && Number.isFinite(Number(row.resolution_minutes)))
  const summary = {
    total_maintenance: records.length,
    resolved_count: resolvedRecords.length,
    avg_resolution_minutes: resolvedRecords.length
      ? resolvedRecords.reduce((sum, row) => sum + Number(row.resolution_minutes || 0), 0) / resolvedRecords.length
      : null,
    total_spent: records.reduce((sum, row) => sum + Number(row.cost_to_repair || 0), 0)
  }

  const mostMaintenancedRide = frequencyByRide.length
    ? [...frequencyByRide].sort((a, b) => {
      const countDiff = Number(b.maintenance_count || 0) - Number(a.maintenance_count || 0)
      if (countDiff !== 0) return countDiff
      return Number(b.total_spent || 0) - Number(a.total_spent || 0)
    })[0]
    : null

  const hasActiveFilters = Boolean(reportStart || reportEnd || reportMonth !== 'all' || reportYear !== 'all' || reportPriorityFilter !== 'all' || selectedRideTypes.length || selectedRideIds.length)

  return (
    <div style={{ marginBottom: '3rem' }}>
      <h3 className="gm-section-title">Maintenance Report</h3>

      <div className="gm-form-card">
        <div className="rev-period-row">
          <div className="rev-period-group">
            <div className="rev-filter-field">
              <label className="rev-filter-label">Start</label>
              <input className="rev-input" type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
            </div>
            <div className="rev-filter-field">
              <label className="rev-filter-label">End</label>
              <input className="rev-input" type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
            </div>
          </div>

          <div className="rev-period-divider" />

          <div className="rev-period-group">
            <div className="rev-filter-field">
              <label className="rev-filter-label">Month</label>
              <div className="rev-select-wrapper">
                <select className="rev-select" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                  <option value="all">All months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <span className="rev-select-arrow">&#9662;</span>
              </div>
            </div>

            <div className="rev-filter-field">
              <label className="rev-filter-label">Year</label>
              <div className="rev-select-wrapper">
                <select className="rev-select" value={reportYear} onChange={(e) => setReportYear(e.target.value)}>
                  <option value="all">All years</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
                <span className="rev-select-arrow">&#9662;</span>
              </div>
            </div>

            <div className="rev-filter-field">
              <label className="rev-filter-label">Priority</label>
              <div className="rev-select-wrapper">
                <select className="rev-select" value={reportPriorityFilter} onChange={(e) => setReportPriorityFilter(e.target.value)}>
                  <option value="all">All priorities</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <span className="rev-select-arrow">&#9662;</span>
              </div>
            </div>
          </div>

          <div className="rev-filter-actions">
            <button className="rev-apply-btn" onClick={loadReport} disabled={reportLoading}>
              {reportLoading ? 'Applying...' : 'Apply'}
            </button>
            {hasActiveFilters && (
              <button className="rev-clear-btn" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="rev-toggle-section">
          <label className="rev-filter-label">Ride Types</label>
          <div className="rev-chip-group" style={{ marginBottom: '0.75rem' }}>
            {rideTypeOptions.map((rideType) => {
              const isActive = selectedRideTypeSet.has(rideType)
              return (
                <button
                  key={rideType}
                  className={`rev-chip ${isActive ? 'active' : ''}`}
                  onClick={() => toggleRideTypeFilter(rideType)}
                >
                  {rideType}
                </button>
              )
            })}
            {!rideTypeOptions.length && <span className="rev-chip-empty">Loading ride types...</span>}
          </div>

          <label className="rev-filter-label">Rides</label>
          <div className="rev-chip-group">
            {visibleRides.map((ride) => {
              const isActive = selectedRideIds.includes(String(ride.ride_id))
              return (
                <button
                  key={ride.ride_id}
                  className={`rev-chip ${isActive ? 'active' : ''}`}
                  onClick={() => toggleRideFilter(ride.ride_id)}
                >
                  {ride.ride_name}
                </button>
              )
            })}
            {!visibleRides.length && <span className="rev-chip-empty">No rides match selected ride types</span>}
            {!ridesOptions.length && <span className="rev-chip-empty">Loading rides...</span>}
          </div>
        </div>
      </div>

      {reportError && <p style={{ color: 'red' }}>{reportError}</p>}
      {reportLoading && <p>Loading maintenance report...</p>}

      {!reportLoading && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
              marginBottom: 16
            }}
          >
            <article style={{ padding: 12, borderRadius: 10, background: 'rgba(241, 245, 249, 0.9)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Most Maintenanced Ride</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: '#0f172a' }}>
                {mostMaintenancedRide?.ride_name || 'No data'}
              </div>
              <div style={{ marginTop: 3, color: '#475569' }}>
                {mostMaintenancedRide ? `${mostMaintenancedRide.maintenance_count} requests` : ''}
              </div>
            </article>

            <article style={{ padding: 12, borderRadius: 10, background: 'rgba(241, 245, 249, 0.9)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Maintenance Requests</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: '#0f172a' }}>
                {summary.total_maintenance || 0}
              </div>
            </article>

            <article style={{ padding: 12, borderRadius: 10, background: 'rgba(241, 245, 249, 0.9)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Average Resolution Time</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: '#0f172a' }}>
                {formatMinutes(summary.avg_resolution_minutes)}
              </div>
            </article>

            <article style={{ padding: 12, borderRadius: 10, background: 'rgba(241, 245, 249, 0.9)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Spent</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: '#0f172a' }}>
                ${Number(summary.total_spent || 0).toFixed(2)}
              </div>
            </article>
          </div>

          <div className="gm-report-view-actions" style={{ marginBottom: 10 }}>
            <button
              className={`gm-toggle-btn gm-report-action-btn ${reportTableView === 'records' ? 'active' : ''}`}
              onClick={() => setReportTableView('records')}
            >
              Show All Maintenance
            </button>
            <button
              className={`gm-toggle-btn gm-report-action-btn ${reportTableView === 'ride' ? 'active' : ''}`}
              onClick={() => setReportTableView('ride')}
            >
              Show Frequency by Ride
            </button>
            <button
              className={`gm-toggle-btn gm-report-action-btn ${reportTableView === 'date' ? 'active' : ''}`}
              onClick={() => setReportTableView('date')}
            >
              Show Frequency by Date
            </button>
          </div>

          {reportTableView === 'ride' && (
            <>
              <h3 className="gm-section-title">Maintenance Frequency By Ride</h3>
              <div className="gm-table-wrapper">
                <table className="gm-table">
                  <thead>
                    <tr>
                      <th>Ride</th>
                      <th>How Often</th>
                      <th>Total Spent</th>
                      <th>Avg Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frequencyByRide.map((row) => (
                      <tr key={row.ride_id}>
                        <td>{row.ride_name}</td>
                        <td>{row.maintenance_count}</td>
                        <td>${Number(row.total_spent || 0).toFixed(2)}</td>
                        <td>{formatMinutes(row.avg_resolution_minutes)}</td>
                      </tr>
                    ))}
                    {frequencyByRide.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center' }}>No maintenance frequency data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {reportTableView === 'date' && (
            <>
              <h3 className="gm-section-title">Maintenance Frequency By Date</h3>
              <div className="gm-table-wrapper">
                <table className="gm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>How Often</th>
                      <th>Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {frequencyByDay.map((row, index) => (
                      <tr key={`${row.maintenance_date}-${index}`}>
                        <td>{new Date(row.maintenance_date).toLocaleDateString()}</td>
                        <td>{row.maintenance_count}</td>
                        <td>${Number(row.total_spent || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {frequencyByDay.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center' }}>No maintenance date data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {reportTableView === 'records' && (
            <>
              <h3 className="gm-section-title">All Maintenance Records</h3>
              <div className="gm-table-wrapper">
                <table className="gm-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Ride</th>
                      <th>Current Ride Status</th>
                      <th>Issue</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Created</th>
                      <th>Resolved In</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((row) => (
                      <tr key={row.request_id}>
                        <td>{row.request_id}</td>
                        <td>{row.ride_name}</td>
                        <td>{formatStatusLabel(row.current_ride_status)}</td>
                        <td>{row.issue_description}</td>
                        <td>{row.priority}</td>
                        <td>{formatStatusLabel(row.status_request)}</td>
                        <td>{row.assigned_employee_name || 'Unassigned'}</td>
                        <td>{new Date(row.created_time).toLocaleString()}</td>
                        <td>{formatMinutes(row.resolution_minutes)}</td>
                        <td>${Number(row.cost_to_repair || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan="10" style={{ textAlign: 'center' }}>No maintenance records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default MaintenanceReport
