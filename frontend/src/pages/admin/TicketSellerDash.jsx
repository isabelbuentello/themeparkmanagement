import { useState, useEffect } from 'react'

function TicketSellerDash() {
  const [ticketTypes, setTicketTypes] = useState([])
  const [passTypes, setPassTypes] = useState([])
  const [activeTab, setActiveTab] = useState('tickets')

  // ticket form
  const [ticketTypeId, setTicketTypeId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [validDate, setValidDate] = useState('')
  const [ticketPayment, setTicketPayment] = useState('card')

  // pass form
  const [passTypeId, setPassTypeId] = useState('')
  const [passCustomerId, setPassCustomerId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [passPayment, setPassPayment] = useState('card')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  // fetch ticket types and pass types on load
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const [ticketRes, passRes] = await Promise.all([
          fetch('/api/transactions/ticket-types', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/transactions/pass-types', {
            headers: { Authorization: `Bearer ${token}` }
          })
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

  const handleSellTicket = async () => {
    setMessage('')
    setError('')

    if (!ticketTypeId || !customerId || !validDate) {
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
          customer_id: parseInt(customerId),
          valid_date: validDate,
          payment_method_transaction: ticketPayment,
          account_id: null
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ Ticket sold! Total: $${data.total}`)
      setTicketTypeId('')
      setCustomerId('')
      setValidDate('')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleSellPass = async () => {
    setMessage('')
    setError('')

    if (!passTypeId || !passCustomerId || !quantity) {
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
          customer_id: parseInt(passCustomerId),
          quantity_purchased: parseInt(quantity),
          payment_method_transaction: passPayment,
          account_id: null
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ Pass sold! Total: $${data.total}`)
      setPassTypeId('')
      setPassCustomerId('')
      setQuantity(1)
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

          <label>Customer ID</label>
          <input
            type="number"
            placeholder="Enter customer ID"
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
          />

          <label>Valid Date</label>
          <input
            type="date"
            value={validDate}
            onChange={e => setValidDate(e.target.value)}
          />

          <label>Payment Method</label>
          <select value={ticketPayment} onChange={e => setTicketPayment(e.target.value)}>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>

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
              <option key={p.pass_type_id} value={p.pass_type_id}>
                {p.pass_name}
              </option>
            ))}
          </select>

          <label>Customer ID</label>
          <input
            type="number"
            placeholder="Enter customer ID"
            value={passCustomerId}
            onChange={e => setPassCustomerId(e.target.value)}
          />

          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />

          <label>Payment Method</label>
          <select value={passPayment} onChange={e => setPassPayment(e.target.value)}>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>

          <button onClick={handleSellPass} disabled={loading}>
            {loading ? 'Processing...' : 'Sell Pass'}
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketSellerDash
