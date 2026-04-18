import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/gm-dash.css'

function MaintenanceDash() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState([])
  const [broken, setBroken] = useState([])
  const [requests, setRequests] = useState([])
  const [logs, setLogs] = useState([])
  const [trainingRequests, setTrainingRequests] = useState([])
  const [rainouts, setRainouts] = useState([])
  const [ridesOptions, setRidesOptions] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [pageError, setPageError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [logError, setLogError] = useState('')
  const [logMessage, setLogMessage] = useState('')
  const [trainingError, setTrainingError] = useState('')
  const [trainingMessage, setTrainingMessage] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('all')
  const [requestAssignmentFilter, setRequestAssignmentFilter] = useState('all')
  const [requestPriorityFilter, setRequestPriorityFilter] = useState('all')
  const [logStatusFilter, setLogStatusFilter] = useState('all')
  const [rainoutRideFilter, setRainoutRideFilter] = useState('all')
  const [requestDrafts, setRequestDrafts] = useState({})
  const [rideOverviewTypeFilter, setRideOverviewTypeFilter] = useState('all')
  const [rideOverviewStatusFilter, setRideOverviewStatusFilter] = useState('all')
  const [rideOverviewSort, setRideOverviewSort] = useState('none')

  const [newLog, setNewLog] = useState({
    ride_id: '',
    issue_description: '',
    status_maintenance: 'broken'
  })

  const [newTrainingRequest, setNewTrainingRequest] = useState({
    employee_id: '',
    ride_id: '',
    requested_level: 'basic'
  })

  const token = localStorage.getItem('token')

  const authHeaders = {
    Authorization: 'Bearer ' + token
  }

  const jsonHeaders = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + token
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

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = requestStatusFilter === 'all' || request.status_request === requestStatusFilter
    const matchesPriority = requestPriorityFilter === 'all' || request.priority === requestPriorityFilter
    const isAssigned = Boolean(request.assigned_to_employee_id)
    const matchesAssignment =
      requestAssignmentFilter === 'all' ||
      (requestAssignmentFilter === 'assigned' && isAssigned) ||
      (requestAssignmentFilter === 'unassigned' && !isAssigned)

    return matchesStatus && matchesPriority && matchesAssignment
  })

  const filteredLogs = logs.filter((log) => logStatusFilter === 'all' || log.status_maintenance === logStatusFilter)

  const filteredRainouts = rainouts.filter(
    (rainout) => rainoutRideFilter === 'all' || String(rainout.ride_id) === rainoutRideFilter
  )

  const filteredRideOverview = [...overview]
    .filter((ride) => rideOverviewTypeFilter === 'all' || ride.ride_type === rideOverviewTypeFilter)
    .filter((ride) => rideOverviewStatusFilter === 'all' || ride.status_ride === rideOverviewStatusFilter)
    .sort((leftRide, rightRide) => {
      if (rideOverviewSort === 'asc') {
        return leftRide.ride_name.localeCompare(rightRide.ride_name)
      }

      if (rideOverviewSort === 'desc') {
        return rightRide.ride_name.localeCompare(leftRide.ride_name)
      }

      return 0
    })

  const statusBadgeStyle = (status) => {
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
      const [overviewRes, brokenRes, requestsRes, logsRes, trainingRes, rainoutsRes, ridesRes, employeesRes] = await Promise.all([
        fetch('/api/maintenance/overview', {
          headers: authHeaders
        }),
        fetch('/api/maintenance/broken', {
          headers: authHeaders
        }),
        fetch('/api/maintenance/requests', {
          headers: authHeaders
        }),
        fetch('/api/maintenance/logs', {
          headers: authHeaders
        }),
        fetch('/api/maintenance/training-requests', {
          headers: authHeaders
        }),
        fetch('/api/rides/rainouts', {
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
      const trainingData = await handleResponse(trainingRes)
      const rainoutsData = await handleResponse(rainoutsRes)
      const ridesData = await handleResponse(ridesRes)
      const employeesData = await handleResponse(employeesRes)

      setOverview(overviewData)
      setBroken(brokenData)
      setRequests(requestsData)
      setLogs(logsData)
      setTrainingRequests(trainingData)
      setRainouts(rainoutsData)
      setRidesOptions(ridesData)
      setEmployeeOptions(employeesData)
      setRequestDrafts(
        requestsData.reduce((drafts, request) => {
          drafts[request.request_id] = {
            status_request: request.status_request,
            assigned_to_employee_id: request.assigned_to_employee_id || ''
          }
          return drafts
        }, {})
      )
    } catch (err) {
      setPageError(err.message || 'Failed to connect to backend')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateRequest = async (requestId, status_request, assigned_to_employee_id) => {
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

    try {
      let nextStatusRequest = status_request
      if (assignedEmployeeId && (!nextStatusRequest || nextStatusRequest === 'new')) {
        nextStatusRequest = 'assigned'
      }

      const payload = { status_request: nextStatusRequest }
      if (assignedEmployeeId) {
        payload.assigned_to_employee_id = assignedEmployeeId
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

  const createLog = async () => {
    setPageError('')
    setLogError('')
    setLogMessage('')

    const rideId = parsePositiveInt(newLog.ride_id)
    if (!rideId) {
      setLogError('Invalid ride ID')
      return
    }

    if (!newLog.issue_description.trim()) {
      setLogError('Issue description is required')
      return
    }

    try {
      await handleResponse(
        await fetch('/api/maintenance/logs', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            ride_id: rideId,
            issue_description: newLog.issue_description,
            status_maintenance: newLog.status_maintenance
          })
        })
      )

      setLogMessage('Maintenance log created')
      setNewLog({ ride_id: '', issue_description: '', status_maintenance: 'broken' })
      loadData()
    } catch (err) {
      setLogError(mapInvalidIdError(err, 'Failed to create log'))
    }
  }

  const updateLogStatus = async (logId, status_maintenance) => {
    setPageError('')
    setLogError('')
    setLogMessage('')
    try {
      await handleResponse(
        await fetch('/api/maintenance/logs/' + logId + '/status', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({ status_maintenance })
        })
      )

      setLogMessage('Log updated')
      loadData()
    } catch (err) {
      setLogError(err.message || 'Failed to update log')
    }
  }

  const createTrainingRequest = async () => {
    setPageError('')
    setTrainingError('')
    setTrainingMessage('')

    const employeeId = parsePositiveInt(newTrainingRequest.employee_id)
    const rideId = parsePositiveInt(newTrainingRequest.ride_id)
    if (!rideId) {
      setTrainingError('Invalid ride ID')
      return
    }
    if (!employeeId){
      setTrainingError('Invalid employee ID')
      return
    }

    try {
      await handleResponse(
        await fetch('/api/maintenance/training-requests', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            employee_id: employeeId,
            ride_id: rideId,
            requested_level: newTrainingRequest.requested_level
          })
        })
      )

      setTrainingMessage('Training request submitted')
      setNewTrainingRequest({ employee_id: '', ride_id: '', requested_level: 'basic' })
      loadData()
    } catch (err) {
      setTrainingError(mapInvalidIdError(err, 'Failed to submit training request'))
    }
  }

  const reviewTrainingRequest = async (training_request_id, status_training_request) => {
    setPageError('')
    setTrainingError('')
    setTrainingMessage('')
    try {
      await handleResponse(
        await fetch('/api/maintenance/training-requests/' + training_request_id + '/review', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({ status_training_request })
        })
      )

      setTrainingMessage('Training request reviewed')
      loadData()
    } catch (err) {
      setTrainingError(err.message || 'Failed to review training request')
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
          <option value="closed_weather">closed_weather</option>
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
        {filteredRideOverview.map((ride) => (
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
          {filteredRainouts.map((rainout) => (
            <tr key={rainout.rainout_id}>
              <td>{rainout.ride_name}</td>
              <td>{new Date(rainout.rainout_time).toLocaleString()}</td>
              <td>{rainout.status_ride}</td>
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
          <option value="in_progress">in_progress</option>
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
            <th>Status</th>
            <th>Assign To Employee ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((request) => (
            <tr key={request.request_id}>
              <td>{request.request_id}</td>
              <td>{request.ride_name}</td>
              <td>{request.issue_description}</td>
              <td>{request.priority}</td>
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
                            currentDrafts[request.request_id]?.assigned_to_employee_id || request.assigned_to_employee_id || ''
                        }
                      }))
                    }}
                  >
                    <option value="new">new</option>
                    <option value="assigned">assigned</option>
                    <option value="in_progress">in_progress</option>
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
                            status_request: nextAssigned ? 'assigned' : (currentDrafts[request.request_id]?.status_request || request.status_request)
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
                {request.status_request === 'resolved' ? null : (
                  <button
                    onClick={() =>
                      updateRequest(
                        request.request_id,
                        requestDrafts[request.request_id]?.status_request || request.status_request,
                        requestDrafts[request.request_id]?.assigned_to_employee_id ?? request.assigned_to_employee_id
                      )
                    }
                  >
                    Save
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h2 className="gm-section-title">Maintenance Logs</h2>
      <div style={{ marginBottom: 10 }}>
        <select value={logStatusFilter} onChange={(e) => setLogStatusFilter(e.target.value)}>
          <option value="all">All log statuses</option>
          <option value="broken">broken</option>
          <option value="in-progress">in-progress</option>
          <option value="fixed">fixed</option>
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <select
          value={newLog.ride_id}
          onChange={(e) => setNewLog((prev) => ({ ...prev, ride_id: e.target.value }))}
        >
          <option value="">Select Ride</option>
          {ridesOptions.map((ride) => (
            <option key={ride.ride_id} value={ride.ride_id}>
              {ride.ride_name}
            </option>
          ))}
        </select>
        <input
          placeholder="Issue Description"
          value={newLog.issue_description}
          onChange={(e) => setNewLog((prev) => ({ ...prev, issue_description: e.target.value }))}
          style={{ marginLeft: 8 }}
        />
        <select
          value={newLog.status_maintenance}
          onChange={(e) => setNewLog((prev) => ({ ...prev, status_maintenance: e.target.value }))}
          style={{ marginLeft: 8 }}
        >
          <option value="broken">broken</option>
          <option value="in-progress">in-progress</option>
          <option value="fixed">fixed</option>
        </select>
        <button onClick={createLog} style={{ marginLeft: 8 }}>
          Create Log
        </button>
      </div>

      {logError && <p style={{ color: 'red' }}>{logError}</p>}
      {logMessage && <p style={{ color: 'green' }}>{logMessage}</p>}

      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>Log ID</th>
            <th>Ride</th>
            <th>Issue</th>
            <th>Status</th>
            <th>Set Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.log_id}>
              <td>{log.log_id}</td>
              <td>{log.ride_name}</td>
              <td>{log.issue_description}</td>
              <td>{log.status_maintenance}</td>
              <td>
                <button onClick={() => updateLogStatus(log.log_id, 'broken')}>broken</button>
                <button onClick={() => updateLogStatus(log.log_id, 'in-progress')} style={{ marginLeft: 6 }}>
                  in-progress
                </button>
                <button onClick={() => updateLogStatus(log.log_id, 'fixed')} style={{ marginLeft: 6 }}>
                  fixed
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <h2 className="gm-section-title">Training Approval Requests</h2>
      <div style={{ marginBottom: 10 }}>
        <select
          value={newTrainingRequest.employee_id}
          onChange={(e) => setNewTrainingRequest((prev) => ({ ...prev, employee_id: e.target.value }))}
        >
          <option value="">Select Employee</option>
          {employeeOptions.map((employee) => (
            <option key={employee.employee_id} value={employee.employee_id}>
              {employee.full_name}
            </option>
          ))}
        </select>
        <select
          value={newTrainingRequest.ride_id}
          onChange={(e) => setNewTrainingRequest((prev) => ({ ...prev, ride_id: e.target.value }))}
          style={{ marginLeft: 8 }}
        >
          <option value="">Select Ride</option>
          {ridesOptions.map((ride) => (
            <option key={ride.ride_id} value={ride.ride_id}>
              {ride.ride_name}
            </option>
          ))}
        </select>
        <select
          value={newTrainingRequest.requested_level}
          onChange={(e) => setNewTrainingRequest((prev) => ({ ...prev, requested_level: e.target.value }))}
          style={{ marginLeft: 8 }}
        >
          <option value="basic">basic</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
        <button onClick={createTrainingRequest} style={{ marginLeft: 8 }}>
          Submit Training Request
        </button>
      </div>

      {trainingError && <p style={{ color: 'red' }}>{trainingError}</p>}
      {trainingMessage && <p style={{ color: 'green' }}>{trainingMessage}</p>}

      <div className="gm-table-wrapper">
      <table className="gm-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Ride</th>
            <th>Level</th>
            <th>Status</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {trainingRequests.map((request) => (
            <tr key={request.training_request_id}>
              <td>{request.training_request_id}</td>
              <td>{request.full_name}</td>
              <td>{request.ride_name}</td>
              <td>{request.requested_level}</td>
              <td>{request.status_training_request}</td>
              <td>
                <button
                  onClick={() => reviewTrainingRequest(request.training_request_id, 'approved')}
                  disabled={request.status_training_request !== 'pending'}
                >
                  Approve
                </button>
                <button
                  onClick={() => reviewTrainingRequest(request.training_request_id, 'rejected')}
                  disabled={request.status_training_request !== 'pending'}
                  style={{ marginLeft: 6 }}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}

export default MaintenanceDash