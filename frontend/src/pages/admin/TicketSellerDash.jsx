import { useState, useEffect } from 'react'

const styles = {
  page: { padding: '32px 24px', maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--body-font)', color: 'var(--ink)' },
  header: { fontSize: '2rem', fontFamily: 'var(--heading-font)', color: 'var(--ink)', marginBottom: '8px', fontWeight: 700 },
  subtitle: { color: 'var(--muted)', marginBottom: '24px', fontSize: '0.95rem' },
  alert: (type) => ({
    padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.9rem', fontWeight: 500,
    background: type === 'success' ? 'rgba(34, 197, 94, 0.12)' : type === 'warning' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.12)',
    color: type === 'success' ? '#166534' : type === 'warning' ? '#854d0e' : '#b91c1c',
    border: `1px solid ${type === 'success' ? 'rgba(34, 197, 94, 0.2)' : type === 'warning' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
  }),
  tabs: { display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '2px solid var(--border)', paddingBottom: '0' },
  tab: (active) => ({
    padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: '-2px',
    color: active ? 'var(--accent)' : 'var(--muted)', fontWeight: active ? 700 : 500, fontSize: '0.95rem',
    fontFamily: 'var(--body-font)', transition: 'all 0.2s'
  }),
  card: { background: 'var(--panel)', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--border)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px', marginTop: 0 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', width: '100%' },
  select: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', width: '100%' },
  btnPrimary: { padding: '11px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%', marginTop: '4px' },
  btnOcean: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--ocean)', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' },
}

function TicketSellerDash() {
  const [ticketTypes, setTicketTypes] = useState([])
  const [passTypes, setPassTypes] = useState([])
  const [activeTab, setActiveTab] = useState('tickets')

  const [ticketTypeId, setTicketTypeId] = useState('')
  const [validDate, setValidDate] = useState('')
  const [ticketPayment, setTicketPayment] = useState('card')
  const [ticketEmail, setTicketEmail] = useState('')
  const [ticketCustomerInfo, setTicketCustomerInfo] = useState(null)
  const [ticketEmailError, setTicketEmailError] = useState('')

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
      if (res.ok) { setCustomerInfo(data) } else { setEmailError('Customer not found — will sell as guest') }
    } catch {
      setEmailError('Could not look up customer')
    }
  }

  const handleSellTicket = async () => {
    setMessage('')
    setError('')
    if (!ticketTypeId || !validDate) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/transactions/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      setMessage(`Ticket sold! Total: $${data.total}${ticketCustomerInfo ? ` — linked to ${ticketCustomerInfo.first_name} ${ticketCustomerInfo.last_name}` : ' (guest)'}`)
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
    if (!passTypeId || !quantity) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/transactions/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      setMessage(`Pass sold! Total: $${data.total}${passCustomerInfo ? ` — linked to ${passCustomerInfo.first_name} ${passCustomerInfo.last_name}` : ' (guest)'}`)
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

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Ticket Seller</h1>
      <p style={styles.subtitle}>Sell tickets and passes to park guests</p>

      {message && <div style={styles.alert('success')}>✅ {message}</div>}
      {error && <div style={styles.alert('error')}>⚠️ {error}</div>}

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'tickets')} onClick={() => { setActiveTab('tickets'); setMessage(''); setError('') }}>
          Sell Ticket
        </button>
        <button style={styles.tab(activeTab === 'passes')} onClick={() => { setActiveTab('passes'); setMessage(''); setError('') }}>
          Sell Pass
        </button>
      </div>

      {activeTab === 'tickets' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Sell a Ticket</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Ticket Type</label>
            <select style={styles.select} value={ticketTypeId} onChange={e => setTicketTypeId(e.target.value)}>
              <option value="">Select a ticket type</option>
              {ticketTypes.map(t => (
                <option key={t.ticket_type_id} value={t.ticket_type_id}>
                  {t.ticket_name} — ${Number(t.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Valid Date</label>
            <input
              style={styles.input}
              type="date"
              value={validDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setValidDate(e.target.value)}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Payment Method</label>
            <select style={styles.select} value={ticketPayment} onChange={e => setTicketPayment(e.target.value)}>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Customer Email (optional)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...styles.input, flex: 1 }}
                type="email"
                placeholder="Enter customer email"
                value={ticketEmail}
                onChange={e => { setTicketEmail(e.target.value); setTicketCustomerInfo(null); setTicketEmailError('') }}
              />
              <button style={styles.btnOcean} type="button" onClick={() => handleEmailLookup(ticketEmail, setTicketCustomerInfo, setTicketEmailError)}>
                Look Up
              </button>
            </div>
            {ticketCustomerInfo && <p style={{ color: '#166534', margin: '4px 0 0', fontSize: '0.88rem' }}>✅ Found: {ticketCustomerInfo.first_name} {ticketCustomerInfo.last_name}</p>}
            {ticketEmailError && <p style={{ color: '#854d0e', margin: '4px 0 0', fontSize: '0.88rem' }}>{ticketEmailError}</p>}
          </div>

          <button style={styles.btnPrimary} onClick={handleSellTicket} disabled={loading}>
            {loading ? 'Processing...' : 'Sell Ticket'}
          </button>
        </div>
      )}

      {activeTab === 'passes' && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Sell a Pass</h2>

          <div style={styles.formGroup}>
            <label style={styles.label}>Pass Type</label>
            <select style={styles.select} value={passTypeId} onChange={e => setPassTypeId(e.target.value)}>
              <option value="">Select a pass type</option>
              {passTypes.map(p => (
                <option key={p.pass_type_id} value={p.pass_type_id}>
                  {p.pass_name} — ${Number(p.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Quantity</label>
            <input style={styles.input} type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Payment Method</label>
            <select style={styles.select} value={passPayment} onChange={e => setPassPayment(e.target.value)}>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Customer Email (optional)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...styles.input, flex: 1 }}
                type="email"
                placeholder="Enter customer email"
                value={passEmail}
                onChange={e => { setPassEmail(e.target.value); setPassCustomerInfo(null); setPassEmailError('') }}
              />
              <button style={styles.btnOcean} type="button" onClick={() => handleEmailLookup(passEmail, setPassCustomerInfo, setPassEmailError)}>
                Look Up
              </button>
            </div>
            {passCustomerInfo && <p style={{ color: '#166534', margin: '4px 0 0', fontSize: '0.88rem' }}>✅ Found: {passCustomerInfo.first_name} {passCustomerInfo.last_name}</p>}
            {passEmailError && <p style={{ color: '#854d0e', margin: '4px 0 0', fontSize: '0.88rem' }}>{passEmailError}</p>}
          </div>

          <button style={styles.btnPrimary} onClick={handleSellPass} disabled={loading}>
            {loading ? 'Processing...' : 'Sell Pass'}
          </button>
        </div>
      )}
    </div>
  )
}

export default TicketSellerDash