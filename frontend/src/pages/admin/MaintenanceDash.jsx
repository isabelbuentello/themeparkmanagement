import { useEffect, useState } from 'react'

function MaintenanceDash() {
  const [overview, setOverview] = useState([])
  const [broken, setBroken] = useState([])
  const [requests, setRequests] = useState([])
  const [logs, setLogs] = useState([])
  const [trainingRequests, setTrainingRequests] = useState([])
  const [pageError, setPageError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [logError, setLogError] = useState('')
  const [logMessage, setLogMessage] = useState('')
  const [trainingError, setTrainingError] = useState('')
  const [trainingMessage, setTrainingMessage] = useState('')

  const [newRequest, setNewRequest] = useState({
    ride_id: '',
    issue_description: '',
    priority: 'medium'
  })

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

  const loadData = async () => {
    setPageError('')
    try {
      const [overviewRes, brokenRes, requestsRes, logsRes, trainingRes] = await Promise.all([
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
        })
      ])

      const overviewData = await handleResponse(overviewRes)
      const brokenData = await handleResponse(brokenRes)
      const requestsData = await handleResponse(requestsRes)
      const logsData = await handleResponse(logsRes)
      const trainingData = await handleResponse(trainingRes)

      setOverview(overviewData)
      setBroken(brokenData)
      setRequests(requestsData)
      setLogs(logsData)
      setTrainingRequests(trainingData)
    } catch (err) {
      setPageError(err.message || 'Failed to connect to backend')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const createMaintenanceRequest = async () => {
    setPageError('')
    setRequestError('')
    setRequestMessage('')

    const rideId = parsePositiveInt(newRequest.ride_id)
    if (!rideId) {
      setRequestError('Invalid ride ID')
      return
    }

    if (!newRequest.issue_description.trim()) {
      setRequestError('Issue description is required')
      return
    }

    try {
      await handleResponse(
        await fetch('/api/maintenance/requests', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            ride_id: rideId,
            issue_description: newRequest.issue_description,
            priority: newRequest.priority
          })
        })
      )

      setRequestMessage('Maintenance request created')
      setNewRequest({ ride_id: '', issue_description: '', priority: 'medium' })
      loadData()
    } catch (err) {
      setRequestError(mapInvalidIdError(err, 'Failed to create maintenance request'))
    }
  }

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
      const payload = { status_request }
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
    <div>
      <h1>Maintenance Dashboard</h1>
      {pageError && <p style={{ color: 'red' }}>{pageError}</p>}

      <h2>Broken or Under Maintenance</h2>
      <ul>
        {broken.map((ride) => (
          <li key={ride.ride_id}>
            {ride.ride_name} - {ride.status_ride}
          </li>
        ))}
      </ul>

      <h2>Ride Overview</h2>
      <ul>
        {overview.map((ride) => (
          <li key={ride.ride_id}>
            {ride.ride_name} ({ride.ride_type}) - {ride.status_ride}
          </li>
        ))}
      </ul>

      <h2>Maintenance Requests</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Ride ID"
          value={newRequest.ride_id}
          onChange={(e) => setNewRequest((prev) => ({ ...prev, ride_id: e.target.value }))}
        />
        <input
          placeholder="Issue Description"
          value={newRequest.issue_description}
          onChange={(e) => setNewRequest((prev) => ({ ...prev, issue_description: e.target.value }))}
          style={{ marginLeft: 8 }}
        />
        <select
          value={newRequest.priority}
          onChange={(e) => setNewRequest((prev) => ({ ...prev, priority: e.target.value }))}
          style={{ marginLeft: 8 }}
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button onClick={createMaintenanceRequest} style={{ marginLeft: 8 }}>
          Create Request
        </button>
      </div>

      {requestError && <p style={{ color: 'red' }}>{requestError}</p>}
      {requestMessage && <p style={{ color: 'green' }}>{requestMessage}</p>}

      <table border="1" cellPadding="6">
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
          {requests.map((request) => (
            <tr key={request.request_id}>
              <td>{request.request_id}</td>
              <td>{request.ride_name}</td>
              <td>{request.issue_description}</td>
              <td>{request.priority}</td>
              <td>
                <select
                  defaultValue={request.status_request}
                  onChange={(e) => {
                    request._status_request = e.target.value
                  }}
                >
                  <option value="new">new</option>
                  <option value="assigned">assigned</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                </select>
              </td>
              <td>
                <input
                  defaultValue={request.assigned_to_employee_id || ''}
                  onChange={(e) => {
                    request._assigned_to = e.target.value
                  }}
                  style={{ width: 70 }}
                />
              </td>
              <td>
                <button
                  onClick={() =>
                    updateRequest(
                      request.request_id,
                      request._status_request || request.status_request,
                      request._assigned_to || request.assigned_to_employee_id
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

      <h2>Maintenance Logs</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Ride ID"
          value={newLog.ride_id}
          onChange={(e) => setNewLog((prev) => ({ ...prev, ride_id: e.target.value }))}
        />
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

      <table border="1" cellPadding="6">
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
          {logs.map((log) => (
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

      <h2>Training Approval Requests</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Employee ID"
          value={newTrainingRequest.employee_id}
          onChange={(e) => setNewTrainingRequest((prev) => ({ ...prev, employee_id: e.target.value }))}
        />
        <input
          placeholder="Ride ID"
          value={newTrainingRequest.ride_id}
          onChange={(e) => setNewTrainingRequest((prev) => ({ ...prev, ride_id: e.target.value }))}
          style={{ marginLeft: 8 }}
        />
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

      <table border="1" cellPadding="6">
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
  )
}

export default MaintenanceDash