import { useState, useEffect } from 'react'

function RestaurantDash() {
  const [menuItems, setMenuItems] = useState([])
  const [reservations, setReservations] = useState([])
  const [activeTab, setActiveTab] = useState('sell')

  // sell form
  const [venueId, setVenueId] = useState('')
  const [menuItemId, setMenuItemId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')

  // add menu item form
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemVenueId, setNewItemVenueId] = useState('')

  // reservation form
  const [resVenueId, setResVenueId] = useState('')
  const [resCustomerId, setResCustomerId] = useState('')
  const [resDate, setResDate] = useState('')
  const [resTime, setResTime] = useState('')
  const [resPartySize, setResPartySize] = useState(1)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')

  const fetchMenuItems = async () => {
    try {
      const res = await fetch('/api/transactions/restaurants/menu-all', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setMenuItems(data)
    } catch {
      setError('Failed to load menu items')
    }
  }

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/transactions/restaurants/reservations', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setReservations(data)
    } catch {
      setError('Failed to load reservations')
    }
  }

  useEffect(() => {
    fetchMenuItems()
    fetchReservations()
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

  const handleAddItem = async () => {
    setMessage('')
    setError('')

    if (!newItemName || !newItemPrice || !newItemVenueId) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/restaurants/menu/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurant_venue_id: parseInt(newItemVenueId),
          item_name: newItemName,
          price: parseFloat(newItemPrice),
          is_available: true
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage('✅ Menu item added successfully!')
      setNewItemName('')
      setNewItemPrice('')
      setNewItemVenueId('')
      fetchMenuItems()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAvailability = async (item) => {
    setMessage('')
    setError('')

    try {
      const res = await fetch(`/api/transactions/restaurants/menu/toggle/${item.menu_item_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_available: !item.is_available })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ ${item.item_name} marked as ${!item.is_available ? 'available' : 'unavailable'}`)
      fetchMenuItems()
    } catch {
      setError('Something went wrong')
    }
  }

  const handleAddReservation = async () => {
    setMessage('')
    setError('')

    if (!resVenueId || !resCustomerId || !resDate || !resTime || !resPartySize) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/restaurants/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurant_venue_id: parseInt(resVenueId),
          customer_id: parseInt(resCustomerId),
          reservation_date: resDate,
          reservation_time: resTime,
          party_size: parseInt(resPartySize)
        })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage('✅ Reservation created successfully!')
      setResVenueId('')
      setResCustomerId('')
      setResDate('')
      setResTime('')
      setResPartySize(1)
      fetchReservations()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateReservation = async (reservation_id, status) => {
    setMessage('')
    setError('')

    try {
      const res = await fetch(`/api/transactions/restaurants/reservations/${reservation_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status_reservation: status })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      setMessage(`✅ Reservation ${status}!`)
      fetchReservations()
    } catch {
      setError('Something went wrong')
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
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      <h1>Restaurant Manager Dashboard</h1>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <button style={tabStyle('sell')} onClick={() => { setActiveTab('sell'); setMessage(''); setError('') }}>
          Ring Up Order
        </button>
        <button style={tabStyle('menu')} onClick={() => { setActiveTab('menu'); setMessage(''); setError('') }}>
          Manage Menu
        </button>
        <button style={tabStyle('reservations')} onClick={() => { setActiveTab('reservations'); setMessage(''); setError('') }}>
          Reservations
        </button>
      </div>

      {/* SELL TAB */}
      {activeTab === 'sell' && (
        <div>
          <h2>Available Menu Items</h2>
          {menuItems.filter(i => i.is_available).length === 0 ? (
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
                {menuItems.filter(i => i.is_available).map(item => (
                  <tr key={item.menu_item_id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px' }}>{item.item_name}</td>
                    <td style={{ padding: '8px' }}>${item.price}</td>
                    <td style={{ padding: '8px' }}>{item.restaurant_venue_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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
              {menuItems.filter(i => i.is_available).map(item => (
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
      )}

      {/* MANAGE MENU TAB */}
      {activeTab === 'menu' && (
        <div>
          <h2>All Menu Items</h2>
          {menuItems.length === 0 ? (
            <p>No menu items found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ backgroundColor: '#333', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Price</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.menu_item_id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px' }}>{item.item_name}</td>
                    <td style={{ padding: '8px' }}>${item.price}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ color: item.is_available ? 'green' : 'red' }}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button onClick={() => handleToggleAvailability(item)}>
                        {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Add Menu Item</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label>Venue ID</label>
            <input
              type="number"
              placeholder="Enter venue ID"
              value={newItemVenueId}
              onChange={e => setNewItemVenueId(e.target.value)}
            />

            <label>Item Name</label>
            <input
              type="text"
              placeholder="e.g. Cheeseburger"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />

            <label>Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 12.99"
              value={newItemPrice}
              onChange={e => setNewItemPrice(e.target.value)}
            />

            <button onClick={handleAddItem} disabled={loading}>
              {loading ? 'Adding...' : 'Add Menu Item'}
            </button>
          </div>
        </div>
      )}

      {/* RESERVATIONS TAB */}
      {activeTab === 'reservations' && (
        <div>
          <h2>All Reservations</h2>
          {reservations.length === 0 ? (
            <p>No reservations found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ backgroundColor: '#333', color: 'white' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Party Size</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r.reservation_id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '8px' }}>{r.first_name} {r.last_name}</td>
                    <td style={{ padding: '8px' }}>{r.reservation_date?.split('T')[0]}</td>
                    <td style={{ padding: '8px' }}>{r.reservation_time}</td>
                    <td style={{ padding: '8px' }}>{r.party_size}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        color: r.status_reservation === 'confirmed' ? 'green' :
                               r.status_reservation === 'cancelled' ? 'red' : 'orange'
                      }}>
                        {r.status_reservation}
                      </span>
                    </td>
                    <td style={{ padding: '8px', display: 'flex', gap: '5px' }}>
                      {r.status_reservation !== 'confirmed' && (
                        <button onClick={() => handleUpdateReservation(r.reservation_id, 'confirmed')}>
                          Confirm
                        </button>
                      )}
                      {r.status_reservation !== 'cancelled' && (
                        <button onClick={() => handleUpdateReservation(r.reservation_id, 'cancelled')}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2>Add Reservation</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label>Venue ID</label>
            <input
              type="number"
              placeholder="Enter venue ID"
              value={resVenueId}
              onChange={e => setResVenueId(e.target.value)}
            />

            <label>Customer ID</label>
            <input
              type="number"
              placeholder="Enter customer ID"
              value={resCustomerId}
              onChange={e => setResCustomerId(e.target.value)}
            />

            <label>Date</label>
            <input
              type="date"
              value={resDate}
              onChange={e => setResDate(e.target.value)}
            />

            <label>Time</label>
            <input
              type="time"
              value={resTime}
              onChange={e => setResTime(e.target.value)}
            />

            <label>Party Size</label>
            <input
              type="number"
              min="1"
              value={resPartySize}
              onChange={e => setResPartySize(e.target.value)}
            />

            <button onClick={handleAddReservation} disabled={loading}>
              {loading ? 'Adding...' : 'Add Reservation'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantDash