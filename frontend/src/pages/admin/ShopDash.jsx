import { useState, useEffect } from 'react'

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

  useEffect(() => {
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
      if (res.ok) {
        setCustomerInfo(data)
      } else {
        setEmailError('Customer not found — will sell as guest')
      }
    } catch {
      setEmailError('Could not look up customer')
    }
  }

  const handleSell = async () => {
    setMessage('')
    setError('')

    if (!venueId || !quantity || !unitPrice) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/shops/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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

      setMessage(`✅ Sale recorded! Total: $${data.total}${customerInfo ? ` — linked to ${customerInfo.first_name} ${customerInfo.last_name}` : ' (guest)'}`)
      setQuantity(1)
      setUnitPrice('')
      setEmail('')
      setCustomerInfo(null)
      setEmailError('')

      const refreshRes = await fetch('/api/transactions/shops', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const refreshData = await refreshRes.json()
      if (refreshRes.ok) setShops(refreshData)

    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Shop Manager Dashboard</h1>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Shops</h2>
      {shops.length === 0 ? (
        <p>No shops found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: 'white' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Shop Name</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Space (sqft)</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Total Merch Sold</th>
            </tr>
          </thead>
          <tbody>
            {shops.map(shop => (
              <tr key={shop.venue_id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>{shop.venue_name}</td>
                <td style={{ padding: '8px' }}>{shop.space_for_items_sqft}</td>
                <td style={{ padding: '8px' }}>{shop.total_merch_sold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Sell Merchandise</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label>Shop</label>
        <select value={venueId} onChange={e => setVenueId(e.target.value)}>
          <option value="">Select a shop</option>
          {shops.map(shop => (
            <option key={shop.venue_id} value={shop.venue_id}>{shop.venue_name}</option>
          ))}
        </select>

        <label>Quantity</label>
        <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />

        <label>Unit Price ($)</label>
        <input type="number" min="0" step="0.01" placeholder="e.g. 19.99" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />

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

        <button onClick={handleSell} disabled={loading}>
          {loading ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </div>
  )
}

export default ShopDash