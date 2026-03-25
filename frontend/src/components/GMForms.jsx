import { useState, useEffect } from 'react'

function GMForms({ token }) {
  const [ticketForm, setTicketForm] = useState({ ticket_name: 'park entry', ticket_description: '', price: '' })
  const [passForm, setPassForm] = useState({ pass_name: 'fast pass', pass_description: '', price: '' })
  const [tierForm, setTierForm] = useState({ tier_name: 'gold', discount: '', price: '' })
  const [perkForm, setPerkForm] = useState({ perk_name: '', perk_description: '' })
  const [tierPerkForm, setTierPerkForm] = useState({ tier_id: '', perk_id: '' })

  const [tiers, setTiers] = useState([])
  const [perks, setPerks] = useState([])

  const fetchTiersAndPerks = async () => {
    try {
      const [tiersRes, perksRes] = await Promise.all([
        fetch('/api/admin/membership-tiers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/perks', { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      
      if (tiersRes.ok) setTiers(await tiersRes.json())
      if (perksRes.ok) setPerks(await perksRes.json())
    } catch (err) {
      console.error('Error fetching tiers or perks', err)
    }
  }

  useEffect(() => {
    fetchTiersAndPerks()
  }, [])

  const handleConfigSubmit = async (e, endpoint, payload) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        // Refresh dropdowns if new tier or perk is added
        if (endpoint === 'membership-tier' || endpoint === 'perk') {
          fetchTiersAndPerks()
        }
        // Optional: clear the form here after successful submit if you want
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (err) {
      alert('Network error')
    }
  }

  const inputStyle = { marginLeft: '5px', marginRight: '15px' }

  return (
    <div style={{ border: '1px solid #ccc', padding: '1.5rem', marginTop: '1rem', borderRadius: '8px' }}>
      <h3>System Configuration</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Create Ticket Type */}
        <div>
          <h4>Create Ticket Type</h4>
          <form onSubmit={(e) => handleConfigSubmit(e, 'ticket-type', ticketForm)}>
            <label>Ticket Type: 
              <select style={inputStyle} value={ticketForm.ticket_name} onChange={e => setTicketForm({...ticketForm, ticket_name: e.target.value})}>
                <option value="park entry">Park Entry</option>
                <option value="ride ticket">Ride Ticket</option>
              </select>
            </label>

            <label>Description: 
              <input style={inputStyle} type="text" placeholder="Short details" value={ticketForm.ticket_description} onChange={e => setTicketForm({...ticketForm, ticket_description: e.target.value})} />
            </label>

            <label>Price ($): 
              <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={ticketForm.price} onChange={e => setTicketForm({...ticketForm, price: e.target.value})} required />
            </label>
            
            <button type="submit">Add</button>
          </form>
        </div>

        {/* Create Pass Type */}
        <div>
          <h4>Create Pass Type</h4>
          <form onSubmit={(e) => handleConfigSubmit(e, 'pass-type', passForm)}>
            <label>Pass Type: 
              <select style={inputStyle} value={passForm.pass_name} onChange={e => setPassForm({...passForm, pass_name: e.target.value})}>
                <option value="fast pass">Fast Pass</option>
                <option value="food pass">Food Pass</option>
                <option value="parking pass">Parking Pass</option>
                <option value="season pass">Season Pass</option>
                <option value="rides pass">Rides Pass</option>
              </select>
            </label>

            <label>Description: 
              <input style={inputStyle} type="text" placeholder="Short details" value={passForm.pass_description} onChange={e => setPassForm({...passForm, pass_description: e.target.value})} />
            </label>

            <label>Price ($): 
              <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={passForm.price} onChange={e => setPassForm({...passForm, price: e.target.value})} required />
            </label>
            
            <button type="submit">Add</button>
          </form>
        </div>

        {/* Create Membership Tier */}
        <div>
          <h4>Create Membership Tier</h4>
          <form onSubmit={(e) => handleConfigSubmit(e, 'membership-tier', tierForm)}>
            <label>Tier Level: 
              <select style={inputStyle} value={tierForm.tier_name} onChange={e => setTierForm({...tierForm, tier_name: e.target.value})}>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="platinum">Platinum</option>
              </select>
            </label>

            <label>Discount (%): 
              <input style={inputStyle} type="number" min="0" max="100" placeholder="e.g. 15" value={tierForm.discount} onChange={e => setTierForm({...tierForm, discount: e.target.value})} required />
            </label>

            <label>Price ($): 
              <input style={inputStyle} type="number" min="0" step="0.01" placeholder="0.00" value={tierForm.price} onChange={e => setTierForm({...tierForm, price: e.target.value})} required />
            </label>
            
            <button type="submit">Add</button>
          </form>
        </div>

        {/* Create Perk */}
        <div>
          <h4>Create Perk</h4>
          <form onSubmit={(e) => handleConfigSubmit(e, 'perk', perkForm)}>
            <label>Perk Name: 
              <input style={inputStyle} type="text" placeholder="e.g. Free Parking" value={perkForm.perk_name} onChange={e => setPerkForm({...perkForm, perk_name: e.target.value})} required />
            </label>

            <label>Description: 
              <input style={inputStyle} type="text" placeholder="Details about perk" value={perkForm.perk_description} onChange={e => setPerkForm({...perkForm, perk_description: e.target.value})} />
            </label>
            
            <button type="submit">Add</button>
          </form>
        </div>
      </div>

      <hr style={{ margin: '2rem 0' }} />

      {/* Link Perk to Tier */}
      <div style={{ padding: '1rem', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h4>Link Perk to Membership Tier</h4>
        <form onSubmit={(e) => handleConfigSubmit(e, 'tier-perk', tierPerkForm)}>
          <label>Membership Tier: 
            <select style={inputStyle} value={tierPerkForm.tier_id} onChange={e => setTierPerkForm({...tierPerkForm, tier_id: e.target.value})} required>
              <option value="" disabled>Select a Tier...</option>
              {tiers.map(t => <option key={t.tier_id} value={t.tier_id}>{t.tier_name}</option>)}
            </select>
          </label>

          <label>Perk to Add: 
            <select style={inputStyle} value={tierPerkForm.perk_id} onChange={e => setTierPerkForm({...tierPerkForm, perk_id: e.target.value})} required>
              <option value="" disabled>Select a Perk...</option>
              {perks.map(p => <option key={p.perk_id} value={p.perk_id}>{p.perk_name}</option>)}
            </select>
          </label>
          
          <button type="submit">Link Perk to Tier</button>
        </form>
      </div>

    </div>
  )
}

export default GMForms