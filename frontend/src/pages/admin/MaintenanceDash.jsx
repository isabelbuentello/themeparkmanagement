import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/gm-dash.css'

function MaintenanceDash() {
  const navigate = useNavigate()
  const STATUS_OPTIONS = ['open', 'broken', 'maintenance']
  const [overview, setOverview] = useState([])
  const [broken, setBroken] = useState([])
  const [requests, setRequests] = useState([])
  const [logs, setLogs] = useState([])
  const [rainouts, setRainouts] = useState([])
  const [ridesOptions, setRidesOptions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [pageError, setPageError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('all')
  const [requestAssignmentFilter, setRequestAssignmentFilter] = useState('all')
  const [requestPriorityFilter, setRequestPriorityFilter] = useState('all')
  const [rainoutRideFilter, setRainoutRideFilter] = useState('all')
  const [requestDrafts, setRequestDrafts] = useState({})
  const [rideOverviewTypeFilter, setRideOverviewTypeFilter] = useState('all')
  const [rideOverviewStatusFilter, setRideOverviewStatusFilter] = useState('all')
  const [rideOverviewSort, setRideOverviewSort] = useState('none')
  const [reportStart, setReportStart] = useState('')
  const [reportEnd, setReportEnd] = useState('')
  const [reportMonth, setReportMonth] = useState('all')
  const [reportYear, setReportYear] = useState('all')
  const [reportRideFilter, setReportRideFilter] = useState('all')
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
  const [rideStatusDrafts, setRideStatusDrafts] = useState({})
  const [rideStatusError, setRideStatusError] = useState('')
  const [rideStatusMessage, setRideStatusMessage] = useState('')
  const [savingRideId, setSavingRideId] = useState(null)

  const token = localStorage.getItem('token')

  const authHeaders = {
    Authorization: 'Bearer ' + token
  }

  const jsonHeaders = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
  }

  const buildUrlWithParams = (basePath, params) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        searchParams.set(key, value)
      }
    })

    const queryText = searchParams.toString()
    return queryText ? `${basePath}?${queryText}` : basePath
  }

  const handleResponse = async (res) => {
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || 'Request failed')
    }
    return data
  }

  const mapInvalidIdError = (err, fallbackMessage) => {
    const errMessage = err?.message || ''
    if (errMessage === 'Invalid ride ID' || errMessage === 'Invalid employee ID') {
      return errMessage
    }
    if (errMessage === 'Server error') {
      return 'Invalid employee ID or ride ID'
    }
    return errMessage || fallbackMessage
  }

  const parsePositiveInt = (value) => {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed <= 0) return null
    return parsed
  }

  const parseNonNegativeDecimal = (value) => {
    if (value === '' || value === null || value === undefined) return undefined

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed < 0) return null
    return parsed
  }

  const formatMinutes = (minutes) => {
    const parsedMinutes = Number(minutes)
    if (!Number.isFinite(parsedMinutes) || parsedMinutes < 0) {
      return 'Not resolved'
    }

    const roundedMinutes = Math.round(parsedMinutes)
    const days = Math.floor(roundedMinutes / (24 * 60))
    const hours = Math.floor((roundedMinutes % (24 * 60)) / 60)
    const remainingMinutes = roundedMinutes % 60

    if (days > 0) {
      return `${days}d ${hours}h ${remainingMinutes}m`
    }

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`
    }

    return `${remainingMinutes}m`
  }

  const formatStatusLabel = (value) => String(value || '').replaceAll('_', ' ')

  const employeeNameById = employeeOptions.reduce((map, employee) => {
    map[employee.employee_id] = employee.full_name
    return map
  }, {})

  const latestRainoutByRide = rainouts.reduce((map, rainout) => {
    const current = map[rainout.ride_id]
    if (!current || new Date(rainout.rainout_time) > new Date(current.rainout_time)) {
      map[rainout.ride_id] = rainout
    }
    return map
  }, {})

  const maintenanceSummary = ridesOptions.map((ride) => {
    const rideRequests = requests.filter((request) => request.ride_id === ride.ride_id)
    const rideLogs = logs.filter((log) => log.ride_id === ride.ride_id)

    return {
      ride_id: ride.ride_id,
      ride_name: ride.ride_name,
      open_requests: rideRequests.filter((request) => request.status_request !== 'resolved').length,
      assigned_requests: rideRequests.filter((request) => request.assigned_to_employee_id).length,
      open_logs: rideLogs.filter((log) => log.status_maintenance !== 'fixed').length,
      latest_rainout: latestRainoutByRide[ride.ride_id]?.rainout_time || null
    }
  })

  const statusBadgeStyle = (status) => {
    if (status === 'open') {
      return {
        background: 'rgba(22, 163, 74, 0.16)',
        color: '#166534'
      }
    }

    if (status === 'broken') {
      return {
        background: 'rgba(220, 38, 38, 0.14)',
        color: '#b91c1c'
      }
    }

    if (status === 'maintenance') {
      return {
        background: 'rgba(245, 158, 11, 0.16)',
        color: '#b45309'
      }
    }

    if (status === 'closed_weather') {
      return {
        background: 'rgba(59, 130, 246, 0.14)',
        color: '#2563eb'
      }
    }

    return {
      background: 'rgba(100, 116, 139, 0.14)',
      color: '#475569'
    }
  }

  const badgeBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 118,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: '0.78rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap'
  }

  const loadData = async () => {
    setPageError('')
    try {
      const [overviewRes, brokenRes, requestsRes, logsRes, rainoutsRes, ridesRes, employeesRes] = await Promise.all([
        fetch(buildUrlWithParams('/api/maintenance/overview', {
          rideType: rideOverviewTypeFilter,
          status: rideOverviewStatusFilter,
          sort: rideOverviewSort
        }), {
          headers: authHeaders
        }),
        fetch('/api/maintenance/broken', {
          headers: authHeaders
        }),
        fetch(buildUrlWithParams('/api/maintenance/requests', {
          status: requestStatusFilter,
          priority: requestPriorityFilter,
          assignment: requestAssignmentFilter
        }), {
          headers: authHeaders
        }),
        fetch('/api/maintenance/logs', {
          headers: authHeaders
        }),
        fetch(buildUrlWithParams('/api/rides/rainouts', {
          rideId: rainoutRideFilter
        }), {
          headers: authHeaders
        }),
        fetch('/api/rides/all', {
          headers: authHeaders
        }),
        fetch('/api/employees', {
          headers: authHeaders
        })
      ])

      const overviewData = await handleResponse(overviewRes)
      const brokenData = await handleResponse(brokenRes)
      const requestsData = await handleResponse(requestsRes)
      const logsData = await handleResponse(logsRes)
      const rainoutsData = await handleResponse(rainoutsRes)
      const ridesData = await handleResponse(ridesRes)
      const employeesData = await handleResponse(employeesRes)

      setOverview(overviewData)
      setBroken(brokenData)
      setRequests(requestsData)
      setLogs(logsData)
      setRainouts(rainoutsData)
      setRidesOptions(ridesData)
      setEmployeeOptions(employeesData)
      setRideStatusDrafts(
        ridesData.reduce((drafts, ride) => {
          drafts[ride.ride_id] = ride.status_ride
          return drafts
        }, {})
      )
      setRequestDrafts(
        requestsData.reduce((drafts, request) => {
          drafts[request.request_id] = {
            status_request: request.status_request,
            assigned_to_employee_id: request.assigned_to_employee_id || '',
            cost_to_repair: request.cost_to_repair ?? ''
          }
          return drafts
        }, {})
      )
    } catch (err) {
      setPageError(err.message || 'Failed to connect to backend')
    }
  }

  const saveRideStatus = async (rideId) => {
    const nextStatus = rideStatusDrafts[rideId]
    const ride = ridesOptions.find((item) => item.ride_id === rideId)
    if (!ride || !nextStatus || nextStatus === ride.status_ride) {
      return
    }

    setRideStatusError('')
    setRideStatusMessage('')
    setSavingRideId(rideId)

    try {
      await handleResponse(
        await fetch('/api/rides/' + rideId + '/status', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({ status_ride: nextStatus })
        })
      )

      setRideStatusMessage(`Updated ${ride.ride_name} to ${formatStatusLabel(nextStatus)}`)
      loadData()
    } catch (err) {
      setRideStatusError(err.message || 'Failed to update ride status')
    } finally {
      setSavingRideId(null)
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
          rideId: reportRideFilter,
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
    loadData()
  }, [
    requestStatusFilter,
    requestAssignmentFilter,
    requestPriorityFilter,
    rainoutRideFilter,
    rideOverviewTypeFilter,
    rideOverviewStatusFilter,
    rideOverviewSort
  ])

  useEffect(() => {
    loadReport()
  }, [])

  const updateRequest = async (requestId, status_request, assigned_to_employee_id, cost_to_repair) => {
    setPageError('')
    setRequestError('')
    setRequestMessage('')

    let assignedEmployeeId
    if (assigned_to_employee_id !== '' && assigned_to_employee_id !== null && assigned_to_employee_id !== undefined) {
      assignedEmployeeId = parsePositiveInt(assigned_to_employee_id)
      if (!assignedEmployeeId) {
        setRequestError('Invalid employee ID')
        return
      }
    }

    const parsedCostToRepair = parseNonNegativeDecimal(cost_to_repair)
    if (parsedCostToRepair === null) {
      setRequestError('Invalid repair cost')
      return
    }

    try {
      let nextStatusRequest = status_request
      if (assignedEmployeeId && (!nextStatusRequest || nextStatusRequest === 'new')) {
        nextStatusRequest = 'assigned'
      }

      const payload = { status_request: nextStatusRequest }
      if (assignedEmployeeId) {
        payload.assigned_to_employee_id = assignedEmployeeId
      }
      if (parsedCostToRepair !== undefined) {
        payload.cost_to_repair = parsedCostToRepair
      }

      await handleResponse(
        await fetch('/api/maintenance/requests/' + requestId, {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify(payload)
        })
      )

      setRequestMessage('Request updated')
      loadData()
    } catch (err) {
      setRequestError(mapInvalidIdError(err, 'Failed to update request'))
    }
  }

  return (
    <div className="gm-dash-container">
      <div className="gm-header-bar">
        <h1>Maintenance Dashboard</h1>
        <button className="gm-btn-back" onClick={() => navigate('/account/employee')}>Back to Employee Dashboard</button>
      </div>
      {pageError && <p style={{ color: 'red' }}>{pageError}</p>}

      <h2 className="gm-section-title">Broken or Under Maintenance</h2>
      <div
        style={{
          display: 'grid',
          gap: 12,
          marginBottom: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
        }}
      >
        {broken.map((ride) => (
          <article
            key={ride.ride_id}
            style={{
              padding: '16px 18px',
              borderRadius: 14,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <strong style={{ fontSize: '1.02rem' }}>{ride.ride_name}</strong>
              <span
                style={{
                  ...statusBadgeStyle(ride.status_ride),
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {ride.status_ride.replace('_', ' ')}
              </span>
            </div>
            <p style={{ margin: '10px 0 0', color: '#475569', fontSize: '0.92rem' }}>
              This ride is currently unavailable and needs attention before reopening.
            </p>
          </article>
        ))}
      </div>

      <h2 className="gm-section-title">Ride Overview</h2>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={rideOverviewTypeFilter} onChange={(e) => setRideOverviewTypeFilter(e.target.value)}>
          <option value="all">All ride types</option>
          <option value="rollercoaster">rollercoaster</option>
          <option value="water">water</option>
          <option value="kids">kids</option>
        </select>
        <select value={rideOverviewStatusFilter} onChange={(e) => setRideOverviewStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="open">open</option>
          <option value="broken">broken</option>
          <option value="maintenance">maintenance</option>
          <option value="closed_weather">closed weather</option>
        </select>
        <select value={rideOverviewSort} onChange={(e) => setRideOverviewSort(e.target.value)}>
          <option value="none">Default order</option>
          <option value="asc">A-Z</option>
          <option value="desc">Z-A</option>
        </select>
      </div>
      <div
        style={{
          display: 'grid',
          gap: 12,
          marginBottom: 24,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
        }}
      >
        {overview.map((ride) => (
          <article
            key={ride.ride_id}
            style={{
              padding: '16px 18px',
              borderRadius: 14,
              border: '1px solid rgba(148, 163, 184, 0.22)',
              background: 'linear-gradient(180deg, rgba(248,250,252,0.98), rgba(255,255,255,0.92))',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <strong style={{ fontSize: '1.02rem' }}>{ride.ride_name}</strong>
              <span
                style={{
                  ...badgeBaseStyle,
                  ...statusBadgeStyle(ride.status_ride),
                  minWidth: 118
                }}
              >
                {ride.status_ride.replace('_', ' ')}
              </span>
            </div>
            <p style={{ margin: '10px 0 0', color: '#475569', fontSize: '0.92rem' }}>
              <strong>Type:</strong> {ride.ride_type}
            </p>
          </article>
        ))}
      </div>

      <h2 className="gm-section-title">Maintenance Summary</h2>
      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Ride</th>
            <th>Open Requests</th>
            <th>Assigned Requests</th>
            <th>Open Logs</th>
            <th>Latest Rainout</th>
          </tr>
        </thead>
        <tbody>
          {maintenanceSummary.map((row) => (
            <tr key={row.ride_id}>
              <td>{row.ride_name}</td>
              <td>{row.open_requests}</td>
              <td>{row.assigned_requests}</td>
              <td>{row.open_logs}</td>
              <td>{row.latest_rainout ? new Date(row.latest_rainout).toLocaleString() : 'None'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h2 className="gm-section-title">Ride Status Management</h2>
      {rideStatusError && <p style={{ color: 'red' }}>{rideStatusError}</p>}
      {rideStatusMessage && <p style={{ color: 'green' }}>{rideStatusMessage}</p>}
      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Ride</th>
            <th>Current Status</th>
            <th>Set Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {ridesOptions.map((ride) => {
            const nextStatus = rideStatusDrafts[ride.ride_id] || ride.status_ride
            const availableStatuses = STATUS_OPTIONS.filter(
              (status) => status !== 'closed_weather' || Boolean(ride.affected_by_rain)
            )

            return (
              <tr key={ride.ride_id}>
                <td>{ride.ride_name}</td>
                <td>{formatStatusLabel(ride.status_ride)}</td>
                <td>
                  <select
                    value={nextStatus}
                    onChange={(e) =>
                      setRideStatusDrafts((currentDrafts) => ({
                        ...currentDrafts,
                        [ride.ride_id]: e.target.value
                      }))
                    }
                  >
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    disabled={savingRideId === ride.ride_id || nextStatus === ride.status_ride}
                    onClick={() => saveRideStatus(ride.ride_id)}
                  >
                    {savingRideId === ride.ride_id ? 'Saving...' : 'Save'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      <h2 className="gm-section-title">Rainout History</h2>
      <div style={{ marginBottom: 10 }}>
        <select value={rainoutRideFilter} onChange={(e) => setRainoutRideFilter(e.target.value)}>
          <option value="all">All rides</option>
          {ridesOptions.map((ride) => (
            <option key={ride.ride_id} value={ride.ride_id}>
              {ride.ride_name}
            </option>
          ))}
        </select>
      </div>
      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Ride</th>
            <th>Rainout Time</th>
            <th>Status After Rainout</th>
          </tr>
        </thead>
        <tbody>
          {rainouts.map((rainout) => (
            <tr key={rainout.rainout_id}>
              <td>{rainout.ride_name}</td>
              <td>{new Date(rainout.rainout_time).toLocaleString()}</td>
              <td>{formatStatusLabel(rainout.status_ride)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h2 className="gm-section-title">Maintenance Requests</h2>
      <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={requestStatusFilter} onChange={(e) => setRequestStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="new">new</option>
          <option value="assigned">assigned</option>
          <option value="in_progress">in progress</option>
          <option value="resolved">resolved</option>
        </select>
        <select value={requestPriorityFilter} onChange={(e) => setRequestPriorityFilter(e.target.value)}>
          <option value="all">All priorities</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <select value={requestAssignmentFilter} onChange={(e) => setRequestAssignmentFilter(e.target.value)}>
          <option value="all">All assignments</option>
          <option value="assigned">Assigned</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>
      {requestError && <p style={{ color: 'red' }}>{requestError}</p>}
      {requestMessage && <p style={{ color: 'green' }}>{requestMessage}</p>}

      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ride</th>
            <th>Issue</th>
            <th>Priority</th>
            <th>Repair Cost</th>
            <th>Status</th>
            <th>Assign To Employee ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.request_id}>
              <td>{request.request_id}</td>
              <td>{request.ride_name}</td>
              <td>{request.issue_description}</td>
              <td>{request.priority}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={requestDrafts[request.request_id]?.cost_to_repair ?? request.cost_to_repair ?? ''}
                  onChange={(e) => {
                    const nextCost = e.target.value
                    setRequestDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [request.request_id]: {
                        ...currentDrafts[request.request_id],
                        cost_to_repair: nextCost
                      }
                    }))
                  }}
                  style={{ width: 120 }}
                />
              </td>
              <td>
                {request.status_request === 'resolved' ? (
                  <span>resolved</span>
                ) : (
                  <select
                    value={requestDrafts[request.request_id]?.status_request || request.status_request}
                    onChange={(e) => {
                      const nextStatus = e.target.value
                      setRequestDrafts((currentDrafts) => ({
                        ...currentDrafts,
                        [request.request_id]: {
                          ...currentDrafts[request.request_id],
                          status_request: nextStatus,
                          assigned_to_employee_id:
                            currentDrafts[request.request_id]?.assigned_to_employee_id || request.assigned_to_employee_id || '',
                          cost_to_repair: currentDrafts[request.request_id]?.cost_to_repair ?? request.cost_to_repair ?? ''
                        }
                      }))
                    }}
                  >
                    <option value="new">new</option>
                    <option value="assigned">assigned</option>
                    <option value="in_progress">in progress</option>
                    <option value="resolved">resolved</option>
                  </select>
                )}
              </td>
              <td>
                {request.status_request === 'resolved' ? (
                  <span>
                    {(requestDrafts[request.request_id]?.assigned_to_employee_id || request.assigned_to_employee_id)
                      ? employeeNameById[requestDrafts[request.request_id]?.assigned_to_employee_id || request.assigned_to_employee_id] || ('Employee #' + (requestDrafts[request.request_id]?.assigned_to_employee_id || request.assigned_to_employee_id))
                      : 'Unassigned'}
                  </span>
                ) : (
                  <>
                    <select
                      value={requestDrafts[request.request_id]?.assigned_to_employee_id ?? request.assigned_to_employee_id ?? ''}
                      onChange={(e) => {
                        const nextAssigned = e.target.value
                        setRequestDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [request.request_id]: {
                            ...currentDrafts[request.request_id],
                            assigned_to_employee_id: nextAssigned,
                            status_request: nextAssigned ? 'assigned' : (currentDrafts[request.request_id]?.status_request || request.status_request),
                            cost_to_repair: currentDrafts[request.request_id]?.cost_to_repair ?? request.cost_to_repair ?? ''
                          }
                        }))
                      }}
                      style={{ width: 190 }}
                    >
                      <option value="">Unassigned</option>
                      {employeeOptions.map((employee) => (
                        <option key={employee.employee_id} value={employee.employee_id}>
                          {employee.full_name}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginTop: 6 }}>
                      {(requestDrafts[request.request_id]?.assigned_to_employee_id || request.assigned_to_employee_id)
                        ? employeeNameById[requestDrafts[request.request_id]?.assigned_to_employee_id || request.assigned_to_employee_id] || ('Employee #' + (requestDrafts[request.request_id]?.assigned_to_employee_id || request.assigned_to_employee_id))
                        : 'Unassigned'}
                    </div>
                  </>
                )}
              </td>
              <td>
                <button
                  onClick={() =>
                    updateRequest(
                      request.request_id,
                      requestDrafts[request.request_id]?.status_request || request.status_request,
                      requestDrafts[request.request_id]?.assigned_to_employee_id ?? request.assigned_to_employee_id,
                      requestDrafts[request.request_id]?.cost_to_repair ?? request.cost_to_repair ?? ''
                    )
                  }
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h2 className="gm-section-title">Maintenance Report</h2>
      <div style={{ marginBottom: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label>Start</label>
        <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
        <label>End</label>
        <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
        <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
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
        <select value={reportYear} onChange={(e) => setReportYear(e.target.value)}>
          <option value="all">All years</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>
        <select value={reportRideFilter} onChange={(e) => setReportRideFilter(e.target.value)}>
          <option value="all">All rides</option>
          {ridesOptions.map((ride) => (
            <option key={ride.ride_id} value={ride.ride_id}>
              {ride.ride_name}
            </option>
          ))}
        </select>
        <select value={reportPriorityFilter} onChange={(e) => setReportPriorityFilter(e.target.value)}>
          <option value="all">All priorities</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button onClick={loadReport} disabled={reportLoading}>
          {reportLoading ? 'Applying...' : 'Apply Filters'}
        </button>
      </div>

      {reportError && <p style={{ color: 'red' }}>{reportError}</p>}
      {reportLoading && <p>Loading maintenance report...</p>}

      {!reportLoading && reportData.summary && (
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
                {reportData.mostMaintenancedRide?.ride_name || 'No data'}
              </div>
              <div style={{ marginTop: 3, color: '#475569' }}>
                {reportData.mostMaintenancedRide ? `${reportData.mostMaintenancedRide.maintenance_count} requests` : ''}
              </div>
            </article>

            <article style={{ padding: 12, borderRadius: 10, background: 'rgba(241, 245, 249, 0.9)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Maintenance Requests</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: '#0f172a' }}>
                {reportData.summary.total_maintenance || 0}
              </div>
            </article>

            <article style={{ padding: 12, borderRadius: 10, background: 'rgba(241, 245, 249, 0.9)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Average Resolution Time</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: '#0f172a' }}>
                {formatMinutes(reportData.summary.avg_resolution_minutes)}
              </div>
            </article>

            <article style={{ padding: 12, borderRadius: 10, background: 'rgba(241, 245, 249, 0.9)' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total Spent</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: '#0f172a' }}>
                ${Number(reportData.summary.total_spent || 0).toFixed(2)}
              </div>
            </article>
          </div>

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
              {reportData.frequencyByRide.map((row) => (
                <tr key={row.ride_id}>
                  <td>{row.ride_name}</td>
                  <td>{row.maintenance_count}</td>
                  <td>${Number(row.total_spent || 0).toFixed(2)}</td>
                  <td>{formatMinutes(row.avg_resolution_minutes)}</td>
                </tr>
              ))}
              {reportData.frequencyByRide.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No maintenance frequency data</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

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
              {reportData.frequencyByDay.map((row, index) => (
                <tr key={`${row.maintenance_date}-${index}`}>
                  <td>{new Date(row.maintenance_date).toLocaleDateString()}</td>
                  <td>{row.maintenance_count}</td>
                  <td>${Number(row.total_spent || 0).toFixed(2)}</td>
                </tr>
              ))}
              {reportData.frequencyByDay.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center' }}>No maintenance date data</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

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
              {reportData.records.map((row) => (
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
              {reportData.records.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center' }}>No maintenance records found</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </>
      )}

    </div>
  )
}

export default MaintenanceDash