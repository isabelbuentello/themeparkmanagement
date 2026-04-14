import { useState, useEffect } from 'react'

function TicketSellerDash() {
  const [ticketTypes, setTicketTypes] = useState([])
  const [passTypes, setPassTypes] = useState([])
  const [activeTab, setActiveTab] = useState('tickets')

  // ticket form
  const [ticketTypeId, setTicketTypeId] = useState('')
  const [validDate, setValidDate] = useState('')
  const [ticketPayment, setTicketPayment] = useState('card')
  const [ticketEmail, setTicketEmail] = useState('')
  const [ticketCustomerInfo, setTicketCustomerInfo] = useState(null)
  const [ticketEmailError, setTicketEmailError] = useState('')

  // pass form
  const [passTypeId, setPassTypeId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [passPayment, setPassPayment] = useState('card')
  const [passEmail, setPassEmail] = useState('')
  const [passCustomerInfo, setPassCustomerInfo] = useState(null)
  const [passEmailError, setPassEmailError] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const [ticketRes, passRes] = await Promise.all([
          fetch('/api/transactions/ticket-types', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/transactions/pass-types', { headers: { Authorization: `Bearer ${token}` } })
        ])
        const ticketData = await ticketRes.json()
        const passData = await passRes.json()
        if (ticketRes.ok) setTicketTypes(ticketData)
        if (passRes.ok) setPassTypes(passData)
      } catch {
        setError('Failed to load ticket/pass types')
      }
    }
    fetchTypes()
  }, [])

  const handleEmailLookup = async (email, setCustomerInfo, setEmailError) => {
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
        setEmailError('Customer not found — will sell as guest')
      }
    } catch {
      setEmailError('Could not look up customer')
    }
  }

  const handleSellTicket = async () => {
    setMessage('')
    setError('')

    if (!ticketTypeId || !validDate) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ticket_type_id: parseInt(ticketTypeId),
          customer_id: ticketCustomerInfo?.customer_id || null,
          valid_date: validDate,
          payment_method_transaction: ticketPayment,
          account_id: ticketCustomerInfo?.account_id || null
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ Ticket sold! Total: $${data.total}${ticketCustomerInfo ? ` — linked to ${ticketCustomerInfo.first_name} ${ticketCustomerInfo.last_name}` : ' (guest)'}`)
      setTicketTypeId('')
      setValidDate('')
      setTicketEmail('')
      setTicketCustomerInfo(null)
      setTicketEmailError('')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSellPass = async () => {
    setMessage('')
    setError('')

    if (!passTypeId || !quantity) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/passes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pass_type_id: parseInt(passTypeId),
          customer_id: passCustomerInfo?.customer_id || null,
          quantity_purchased: parseInt(quantity),
          payment_method_transaction: passPayment,
          account_id: passCustomerInfo?.account_id || null
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ Pass sold! Total: $${data.total}${passCustomerInfo ? ` — linked to ${passCustomerInfo.first_name} ${passCustomerInfo.last_name}` : ' (guest)'}`)
      setPassTypeId('')
      setQuantity(1)
      setPassEmail('')
      setPassCustomerInfo(null)
      setPassEmailError('')
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
      <h1>Ticket Seller Dashboard</h1>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '20px' }}>
        <button style={tabStyle('tickets')} onClick={() => { setActiveTab('tickets'); setMessage(''); setError('') }}>
          Sell Ticket
        </button>
        <button style={tabStyle('passes')} onClick={() => { setActiveTab('passes'); setMessage(''); setError('') }}>
          Sell Pass
        </button>
      </div>

      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2>Sell a Ticket</h2>

          <label>Ticket Type</label>
          <select value={ticketTypeId} onChange={e => setTicketTypeId(e.target.value)}>
            <option value="">Select a ticket type</option>
            {ticketTypes.map(t => (
              <option key={t.ticket_type_id} value={t.ticket_type_id}>
                {t.ticket_name} — ${Number(t.price).toFixed(2)}
              </option>
            ))}
          </select>

          <label>Valid Date</label>
          <input type="date" value={validDate} onChange={e => setValidDate(e.target.value)} />

          <label>Payment Method</label>
          <select value={ticketPayment} onChange={e => setTicketPayment(e.target.value)}>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>

          <label>Customer Email (optional)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="Enter customer email"
              value={ticketEmail}
              onChange={e => { setTicketEmail(e.target.value); setTicketCustomerInfo(null); setTicketEmailError('') }}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={() => handleEmailLookup(ticketEmail, setTicketCustomerInfo, setTicketEmailError)} style={{ whiteSpace: 'nowrap' }}>
              Look Up
            </button>
          </div>
          {ticketCustomerInfo && (
            <p style={{ color: 'green', margin: 0 }}>✅ Found: {ticketCustomerInfo.first_name} {ticketCustomerInfo.last_name}</p>
          )}
          {ticketEmailError && (
            <p style={{ color: 'orange', margin: 0 }}>{ticketEmailError}</p>
          )}

          <button onClick={handleSellTicket} disabled={loading}>
            {loading ? 'Processing...' : 'Sell Ticket'}
          </button>
        </div>
      )}

      {activeTab === 'passes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h2>Sell a Pass</h2>

          <label>Pass Type</label>
          <select value={passTypeId} onChange={e => setPassTypeId(e.target.value)}>
            <option value="">Select a pass type</option>
            {passTypes.map(p => (
              <option key={p.pass_type_id} value={p.pass_type_id}>{p.pass_name}</option>
            ))}
          </select>

          <label>Quantity</label>
          <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />

          <label>Payment Method</label>
          <select value={passPayment} onChange={e => setPassPayment(e.target.value)}>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>

          <label>Customer Email (optional)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="Enter customer email"
              value={passEmail}
              onChange={e => { setPassEmail(e.target.value); setPassCustomerInfo(null); setPassEmailError('') }}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={() => handleEmailLookup(passEmail, setPassCustomerInfo, setPassEmailError)} style={{ whiteSpace: 'nowrap' }}>
              Look Up
            </button>
          </div>
          {passCustomerInfo && (
            <p style={{ color: 'green', margin: 0 }}>✅ Found: {passCustomerInfo.first_name} {passCustomerInfo.last_name}</p>
          )}
          {passEmailError && (
            <p style={{ color: 'orange', margin: 0 }}>{passEmailError}</p>
          )}

          <button onClick={handleSellPass} disabled={loading}>
            {loading ? 'Processing...' : 'Sell Pass'}
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketSellerDash