import { useState, useEffect } from 'react'

function ParkingDash() {
  const [lots, setLots] = useState([])
  const [activeTab, setActiveTab] = useState('start')

  // start session form
  const [lotId, setLotId] = useState('')
  const [customerId, setCustomerId] = useState('')

  // end session form
  const [sessionId, setSessionId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [email, setEmail] = useState('')
  const [customerInfo, setCustomerInfo] = useState(null)
  const [emailError, setEmailError] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const res = await fetch('/api/transactions/parking-lots', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) setLots(data)
      } catch {
        setError('Failed to load parking lots')
      }
    }
    fetchLots()
  }, [])

  const handleEmailLookup = async () => {
    setEmailError('')
    setCustomerInfo(null)
    if (!email) return

    try {
      const res = await fetch(`/api/transactions/customer-lookup?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setCustomerInfo(data)
      } else {
        setEmailError('Customer not found — will record as guest')
      }
    } catch {
      setEmailError('Could not look up customer')
    }
  }

  const handleStartSession = async () => {
    setMessage('')
    setError('')

    if (!lotId || !customerId) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/parking/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lot_id: parseInt(lotId),
          customer_id: parseInt(customerId)
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ Parking session started! Session ID: ${data.session_id}`)
      setLotId('')
      setCustomerId('')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    setMessage('')
    setError('')

    if (!sessionId) {
      setError('Please enter a session ID')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/parking/end/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method_transaction: paymentMethod,
          account_id: customerInfo?.account_id || null
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ Session ended! Amount charged: $${data.amount_paid}${customerInfo ? ` — linked to ${customerInfo.first_name} ${customerInfo.last_name}` : ' (guest)'}`)
      setSessionId('')
      setEmail('')
      setCustomerInfo(null)
      setEmailError('')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    backgroundColor: activeTab === tab ? '#333' : '#eee',
    color: activeTab === tab ? 'white' : 'black',
    border: 'none',
    marginRight: '5px'
  })

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Parking Lot Manager Dashboard</h1>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Parking Lots</h2>
      {lots.length === 0 ? (
        <p>No parking lots found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: 'white' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Lot Name</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Spaces</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Hourly Rate</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Hours</th>
            </tr>
          </thead>
          <tbody>
            {lots.map(lot => (
              <tr key={lot.lot_id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>{lot.lot_name}</td>
                <td style={{ padding: '8px' }}>{lot.total_space_available}</td>
                <td style={{ padding: '8px' }}>${lot.hourly_rate}/hr</td>
                <td style={{ padding: '8px' }}>{lot.operating_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button style={tabStyle('start')} onClick={() => { setActiveTab('start'); setMessage(''); setError('') }}>
          Start Session
        </button>
        <button style={tabStyle('end')} onClick={() => { setActiveTab('end'); setMessage(''); setError('') }}>
          End Session
        </button>
      </div>

      {activeTab === 'start' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2>Start Parking Session</h2>

          <label>Parking Lot</label>
          <select value={lotId} onChange={e => setLotId(e.target.value)}>
            <option value="">Select a lot</option>
            {lots.map(lot => (
              <option key={lot.lot_id} value={lot.lot_id}>
                {lot.lot_name} — ${lot.hourly_rate}/hr
              </option>
            ))}
          </select>

          <label>Customer ID</label>
          <input type="number" placeholder="Enter customer ID" value={customerId} onChange={e => setCustomerId(e.target.value)} />

          <button onClick={handleStartSession} disabled={loading}>
            {loading ? 'Processing...' : 'Start Session'}
          </button>
        </div>
      )}

      {activeTab === 'end' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2>End Parking Session</h2>

          <label>Session ID</label>
          <input type="number" placeholder="Enter session ID" value={sessionId} onChange={e => setSessionId(e.target.value)} />

          <label>Payment Method</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>

          <label>Customer Email (optional)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="Enter customer email"
              value={email}
              onChange={e => { setEmail(e.target.value); setCustomerInfo(null); setEmailError('') }}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleEmailLookup} style={{ whiteSpace: 'nowrap' }}>
              Look Up
            </button>
          </div>
          {customerInfo && (
            <p style={{ color: 'green', margin: 0 }}>✅ Found: {customerInfo.first_name} {customerInfo.last_name}</p>
          )}
          {emailError && (
            <p style={{ color: 'orange', margin: 0 }}>{emailError}</p>
          )}

          <button onClick={handleEndSession} disabled={loading}>
            {loading ? 'Processing...' : 'End Session'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ParkingDash