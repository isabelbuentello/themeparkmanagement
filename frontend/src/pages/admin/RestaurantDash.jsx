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
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px' },
  th: { padding: '10px 12px', textAlign: 'left', background: 'var(--ocean)', color: 'white', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.92rem', color: 'var(--ink)' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', width: '100%' },
  select: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', width: '100%' },
  btnPrimary: { padding: '11px 24px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', width: '100%', marginTop: '4px' },
  btnSecondary: { padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--ink)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  btnOcean: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--ocean)', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnDanger: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  btnSuccess: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'rgba(34, 197, 94, 0.12)', color: '#166534', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
  badge: (status) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
    background: status === 'confirmed' ? 'rgba(34, 197, 94, 0.12)' : status === 'cancelled' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(234, 179, 8, 0.12)',
    color: status === 'confirmed' ? '#166534' : status === 'cancelled' ? '#b91c1c' : '#854d0e'
  })
}

function RestaurantDash() {
  const [menuItems, setMenuItems] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [reservations, setReservations] = useState([])
  const [activeTab, setActiveTab] = useState('sell')

  const [menuItemId, setMenuItemId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [email, setEmail] = useState('')
  const [customerInfo, setCustomerInfo] = useState(null)
  const [emailError, setEmailError] = useState('')

  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemVenueId, setNewItemVenueId] = useState('')

  const [resVenueId, setResVenueId] = useState('')
  const [resCustomerEmail, setResCustomerEmail] = useState('')
  const [resCustomerInfo, setResCustomerInfo] = useState(null)
  const [resCustomerEmailError, setResCustomerEmailError] = useState('')
  const [resDate, setResDate] = useState('')
  const [resTime, setResTime] = useState('')
  const [resPartySize, setResPartySize] = useState(1)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const token = localStorage.getItem('token')
  const todayDate = new Date().toISOString().split('T')[0]

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

  const fetchRestaurants = async () => {
    try {
      const res = await fetch('/api/transactions/restaurants', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setRestaurants(data)
    } catch {
      setError('Failed to load restaurants')
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
    fetchRestaurants()
    fetchReservations()
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

  const handleResCustomerEmailLookup = async () => {
    setResCustomerEmailError('')
    setResCustomerInfo(null)
    if (!resCustomerEmail) return
    try {
      const res = await fetch(`/api/transactions/customer-lookup?email=${encodeURIComponent(resCustomerEmail)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) { setResCustomerInfo(data) } else { setResCustomerEmailError('Customer not found') }
    } catch {
      setResCustomerEmailError('Could not look up customer')
    }
  }

  const handleSell = async () => {
    setMessage('')
    setError('')
    if (!menuItemId || !quantity) { setError('Please fill in all fields'); return }

    const selectedItem = menuItems.find(i => i.menu_item_id === parseInt(menuItemId))
    const venueId = selectedItem?.restaurant_venue_id

    setLoading(true)
    try {
      const res = await fetch('/api/transactions/restaurants/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          venue_id: venueId,
          menu_item_id: parseInt(menuItemId),
          quantity: parseInt(quantity),
          payment_method_transaction: paymentMethod,
          account_id: customerInfo?.account_id || null
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setMessage(`Sale recorded! Total: $${data.total_amount}${customerInfo ? ` — linked to ${customerInfo.first_name} ${customerInfo.last_name}` : ' (guest)'}`)
      setMenuItemId('')
      setQuantity(1)
      setEmail('')
      setCustomerInfo(null)
      setEmailError('')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    setMessage('')
    setError('')
    if (!newItemName || !newItemPrice || !newItemVenueId) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/transactions/restaurants/menu/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          restaurant_venue_id: parseInt(newItemVenueId),
          item_name: newItemName,
          price: parseFloat(newItemPrice),
          is_available: true
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setMessage('Menu item added successfully!')
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_available: !item.is_available })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setMessage(`${item.item_name} marked as ${!item.is_available ? 'available' : 'unavailable'}`)
      fetchMenuItems()
    } catch {
      setError('Something went wrong')
    }
  }

  const handleAddReservation = async () => {
    setMessage('')
    setError('')
    if (!resVenueId || !resCustomerInfo || !resDate || !resTime || !resPartySize) {
      setError('Please fill in all fields and look up a customer')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/transactions/restaurants/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          restaurant_venue_id: parseInt(resVenueId),
          customer_id: resCustomerInfo.customer_id,
          reservation_date: resDate,
          reservation_time: resTime,
          party_size: parseInt(resPartySize)
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setMessage('Reservation created successfully!')
      setResVenueId('')
      setResCustomerEmail('')
      setResCustomerInfo(null)
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status_reservation: status })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message); return }
      setMessage(`Reservation ${status}!`)
      fetchReservations()
    } catch {
      setError('Something went wrong')
    }
  }

  const getVenueName = (venueId) => {
    const r = restaurants.find(r => r.venue_id === venueId)
    return r ? r.venue_name : `Venue ${venueId}`
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Restaurant Manager</h1>
      <p style={styles.subtitle}>Manage orders, menu items, and reservations</p>

      {message && <div style={styles.alert('success')}>✅ {message}</div>}
      {error && <div style={styles.alert('error')}>⚠️ {error}</div>}

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'sell')} onClick={() => { setActiveTab('sell'); setMessage(''); setError('') }}>Ring Up Order</button>
        <button style={styles.tab(activeTab === 'menu')} onClick={() => { setActiveTab('menu'); setMessage(''); setError('') }}>Manage Menu</button>
        <button style={styles.tab(activeTab === 'reservations')} onClick={() => { setActiveTab('reservations'); setMessage(''); setError('') }}>Reservations</button>
      </div>

      {activeTab === 'sell' && (
        <div>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Available Menu Items</h2>
            {menuItems.filter(i => i.is_available).length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No menu items available.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, borderRadius: '8px 0 0 0' }}>Item</th>
                    <th style={styles.th}>Price</th>
                    <th style={{ ...styles.th, borderRadius: '0 8px 0 0' }}>Restaurant</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.filter(i => i.is_available).map((item, idx) => (
                    <tr key={item.menu_item_id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(15,28,46,0.02)' }}>
                      <td style={styles.td}>{item.item_name}</td>
                      <td style={styles.td}>${item.price}</td>
                      <td style={styles.td}>{getVenueName(item.restaurant_venue_id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Ring Up Order</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Menu Item</label>
              <select style={styles.select} value={menuItemId} onChange={e => setMenuItemId(e.target.value)}>
                <option value="">Select a menu item</option>
                {menuItems.filter(i => i.is_available).map(item => (
                  <option key={item.menu_item_id} value={item.menu_item_id}>
                    {item.item_name} — ${item.price} ({getVenueName(item.restaurant_venue_id)})
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
              <select style={styles.select} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Customer Email (optional)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...styles.input, flex: 1 }} type="email" placeholder="Enter customer email" value={email} onChange={e => { setEmail(e.target.value); setCustomerInfo(null); setEmailError('') }} />
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
      )}

      {activeTab === 'menu' && (
        <div>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>All Menu Items</h2>
            {menuItems.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No menu items found.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, borderRadius: '8px 0 0 0' }}>Item</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Restaurant</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, borderRadius: '0 8px 0 0' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item, idx) => (
                    <tr key={item.menu_item_id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(15,28,46,0.02)' }}>
                      <td style={styles.td}>{item.item_name}</td>
                      <td style={styles.td}>${item.price}</td>
                      <td style={styles.td}>{getVenueName(item.restaurant_venue_id)}</td>
                      <td style={styles.td}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: item.is_available ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: item.is_available ? '#166534' : '#b91c1c' }}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button style={item.is_available ? styles.btnDanger : styles.btnSuccess} onClick={() => handleToggleAvailability(item)}>
                          {item.is_available ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Add Menu Item</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Restaurant</label>
              <select style={styles.select} value={newItemVenueId} onChange={e => setNewItemVenueId(e.target.value)}>
                <option value="">Select a restaurant</option>
                {restaurants.map(r => (
                  <option key={r.venue_id} value={r.venue_id}>{r.venue_name}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Item Name</label>
              <input style={styles.input} type="text" placeholder="e.g. Cheeseburger" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price ($)</label>
              <input style={styles.input} type="number" min="0" step="0.01" placeholder="e.g. 12.99" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} />
            </div>
            <button style={styles.btnPrimary} onClick={handleAddItem} disabled={loading}>
              {loading ? 'Adding...' : 'Add Menu Item'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'reservations' && (
        <div>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>All Reservations</h2>
            {reservations.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>No reservations found.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, borderRadius: '8px 0 0 0' }}>Customer</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Party Size</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, borderRadius: '0 8px 0 0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r, idx) => (
                    <tr key={r.reservation_id} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(15,28,46,0.02)' }}>
                      <td style={styles.td}>{r.first_name} {r.last_name}</td>
                      <td style={styles.td}>{r.reservation_date?.split('T')[0]}</td>
                      <td style={styles.td}>{r.reservation_time}</td>
                      <td style={styles.td}>{r.party_size}</td>
                      <td style={styles.td}><span style={styles.badge(r.status_reservation)}>{r.status_reservation}</span></td>
                      <td style={{ ...styles.td, display: 'flex', gap: '6px' }}>
                        {r.status_reservation !== 'confirmed' && (
                          <button style={styles.btnSuccess} onClick={() => handleUpdateReservation(r.reservation_id, 'confirmed')}>Confirm</button>
                        )}
                        {r.status_reservation !== 'cancelled' && (
                          <button style={styles.btnDanger} onClick={() => handleUpdateReservation(r.reservation_id, 'cancelled')}>Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Add Reservation</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Restaurant</label>
              <select style={styles.select} value={resVenueId} onChange={e => setResVenueId(e.target.value)}>
                <option value="">Select a restaurant</option>
                {restaurants.map(r => (
                  <option key={r.venue_id} value={r.venue_id}>{r.venue_name}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Customer Email</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...styles.input, flex: 1 }} type="email" placeholder="Enter customer email" value={resCustomerEmail} onChange={e => { setResCustomerEmail(e.target.value); setResCustomerInfo(null); setResCustomerEmailError('') }} />
                <button style={styles.btnOcean} type="button" onClick={handleResCustomerEmailLookup}>Look Up</button>
              </div>
              {resCustomerInfo && <p style={{ color: '#166534', margin: '4px 0 0', fontSize: '0.88rem' }}>✅ Found: {resCustomerInfo.first_name} {resCustomerInfo.last_name}</p>}
              {resCustomerEmailError && <p style={{ color: '#b91c1c', margin: '4px 0 0', fontSize: '0.88rem' }}>{resCustomerEmailError}</p>}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input style={styles.input} type="date" value={resDate} min={todayDate} onChange={e => setResDate(e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Time</label>
              <input style={styles.input} type="time" value={resTime} onChange={e => setResTime(e.target.value)} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Party Size</label>
              <input style={styles.input} type="number" min="1" value={resPartySize} onChange={e => setResPartySize(e.target.value)} />
            </div>
            <button style={styles.btnPrimary} onClick={handleAddReservation} disabled={loading}>
              {loading ? 'Adding...' : 'Add Reservation'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantDash