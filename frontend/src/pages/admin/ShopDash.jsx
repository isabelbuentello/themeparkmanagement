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
  card: { background: 'var(--panel)', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--border)' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px', marginTop: 0 },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px' },
  th: { padding: '10px 12px', textAlign: 'left', background: 'var(--ocean)', color: 'white', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.92rem', color: 'var(--ink)' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', width: '100%' },
  select: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', width: '100%' },
  btnPrimary: { padding: '11px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%', marginTop: '4px' },
  btnOcean: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--ocean)', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  statCard: {
    background: 'var(--panel)', borderRadius: '12px', padding: '16px 20px',
    border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)',
    display: 'flex', flexDirection: 'column', gap: '4px'
  },
  statLabel: { fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.04em' },
  statValue: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' }
}

function ShopDash() {
  const [shops, setShops] = useState([])
  const [venueId, setVenueId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [email, setEmail] = useState('')
  const [customerInfo, setCustomerInfo] = useState(null)
  const [emailError, setEmailError] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/transactions/shops', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setShops(data)
    } catch {
      setError('Failed to load shops')
    }
  }

  useEffect(() => {
    fetchShops()
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
      if (res.ok) { setCustomerInfo(data) } else { setEmailError('Customer not found — will sell as guest') }
    } catch {
      setEmailError('Could not look up customer')
    }
  }

  const handleSell = async () => {
    setMessage('')
    setError('')
    if (!venueId || !quantity || !unitPrice) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/transactions/shops/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          venue_id: parseInt(venueId),
          quantity: parseInt(quantity),
          unit_price: parseFloat(unitPrice),
          payment_method_transaction: paymentMethod,
          account_id: customerInfo?.account_id || null
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setMessage(`Sale recorded! Total: $${data.total}${customerInfo ? ` — linked to ${customerInfo.first_name} ${customerInfo.last_name}` : ' (guest)'}`)
      setQuantity(1)
      setUnitPrice('')
      setEmail('')
      setCustomerInfo(null)
      setEmailError('')
      fetchShops()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const totalMerchSold = shops.reduce((sum, shop) => sum + (shop.total_merch_sold || 0), 0)

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Shop Manager</h1>
      <p style={styles.subtitle}>Manage merchandise sales across all shops</p>

      {message && <div style={styles.alert('success')}>✅ {message}</div>}
      {error && <div style={styles.alert('error')}>⚠️ {error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Shops</span>
          <span style={styles.statValue}>{shops.length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Merch Sold</span>
          <span style={styles.statValue}>{totalMerchSold.toLocaleString()}</span>
        </div>
      </div>

      {/* Shops Overview */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Shops Overview</h2>
        {shops.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No shops found.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, borderRadius: '8px 0 0 0' }}>Shop Name</th>
                <th style={styles.th}>Space (sqft)</th>
                <th style={{ ...styles.th, borderRadius: '0 8px 0 0' }}>Total Merch Sold</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop, idx) => (
                <tr key={shop.venue_id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(15,28,46,0.02)' }}>
                  <td style={styles.td}>{shop.venue_name}</td>
                  <td style={styles.td}>{shop.space_for_items_sqft?.toLocaleString() || '—'}</td>
                  <td style={styles.td}>{shop.total_merch_sold?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sell Form */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Sell Merchandise</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Shop</label>
          <select style={styles.select} value={venueId} onChange={e => setVenueId(e.target.value)}>
            <option value="">Select a shop</option>
            {shops.map(shop => (
              <option key={shop.venue_id} value={shop.venue_id}>{shop.venue_name}</option>
            ))}
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Quantity</label>
          <input style={styles.input} type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Unit Price ($)</label>
          <input style={styles.input} type="number" min="0" step="0.01" placeholder="e.g. 19.99" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Payment Method</label>
          <select style={styles.select} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
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
              value={email}
              onChange={e => { setEmail(e.target.value); setCustomerInfo(null); setEmailError('') }}
            />
            <button style={styles.btnOcean} type="button" onClick={handleEmailLookup}>Look Up</button>
          </div>
          {customerInfo && <p style={{ color: '#166534', margin: '4px 0 0', fontSize: '0.88rem' }}>✅ Found: {customerInfo.first_name} {customerInfo.last_name}</p>}
          {emailError && <p style={{ color: '#854d0e', margin: '4px 0 0', fontSize: '0.88rem' }}>{emailError}</p>}
        </div>

        <button style={styles.btnPrimary} onClick={handleSell} disabled={loading}>
          {loading ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </div>
  )
}

export default ShopDash