import { useState, useEffect } from 'react'

function RestaurantDash() {
  const [menuItems, setMenuItems] = useState([])
  const [venueId, setVenueId] = useState('')
  const [menuItemId, setMenuItemId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  // fetch menu items on load
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const res = await fetch('/api/transactions/restaurants/menu', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) setMenuItems(data)
      } catch {
        setError('Failed to load menu items')
      }
    }
    fetchMenuItems()
  }, [])

  const handleSell = async () => {
    setMessage('')
    setError('')

    if (!venueId || !menuItemId || !quantity) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/restaurants/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: parseInt(venueId),
          menu_item_id: parseInt(menuItemId),
          quantity: parseInt(quantity),
          payment_method_transaction: paymentMethod,
          account_id: null
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ Sale recorded! Total: $${data.total_amount}`)
      setMenuItemId('')
      setQuantity(1)
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Restaurant Manager Dashboard</h1>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Menu Items Overview */}
      <h2>Menu Items</h2>
      {menuItems.length === 0 ? (
        <p>No menu items available.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: 'white' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Price</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Venue ID</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map(item => (
              <tr key={item.menu_item_id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px' }}>{item.item_name}</td>
                <td style={{ padding: '8px' }}>${item.price}</td>
                <td style={{ padding: '8px' }}>{item.restaurant_venue_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Sell Form */}
      <h2>Ring Up Order</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        <label>Venue ID</label>
        <input
          type="number"
          placeholder="Enter venue ID"
          value={venueId}
          onChange={e => setVenueId(e.target.value)}
        />

        <label>Menu Item</label>
        <select value={menuItemId} onChange={e => setMenuItemId(e.target.value)}>
          <option value="">Select a menu item</option>
          {menuItems.map(item => (
            <option key={item.menu_item_id} value={item.menu_item_id}>
              {item.item_name} — ${item.price}
            </option>
          ))}
        </select>

        <label>Quantity</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
        />

        <label>Payment Method</label>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
        </select>

        <button onClick={handleSell} disabled={loading}>
          {loading ? 'Processing...' : 'Complete Sale'}
        </button>
      </div>
    </div>
  )
}

export default RestaurantDash