import { useState } from 'react'
import '../styles/auth-styles.css'

function Register({ onSwitch }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    customer_email: '',
    customer_phone: '',
    customer_birthdate: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegister = async () => {
  setError('')
  setSuccess('')

  // validate that all fields are filled in
  const { username, password, first_name, last_name,
          customer_email, customer_phone, customer_birthdate } = form

  if (!username || !password || !first_name || !last_name ||
      !customer_email || !customer_phone || !customer_birthdate) {
    setError('Please fill in all fields')
    return
  }

  try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message)
        return
      }

      setSuccess('Account created! You can now log in.')
      onSwitch() // flip back to login after success
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
        </div>
        <div className="auth-body">
          {error && <div className="error-msg">{error}</div>}
          {success && <div style={{color: 'green', textAlign:'center', marginBottom: '10px'}}>{success}</div>}
          
          <div className="auth-input-group">
            <input className="auth-input" name="first_name" placeholder="First Name" onChange={handleChange} />
          </div>
          <div className="auth-input-group">
            <input className="auth-input" name="last_name" placeholder="Last Name" onChange={handleChange} />
          </div>
          <div className="auth-input-group">
            <input className="auth-input" name="customer_email" placeholder="Email" onChange={handleChange} />
          </div>
          <div className="auth-input-group">
            <input className="auth-input" name="customer_phone" placeholder="Phone" onChange={handleChange} />
          </div>
          <div className="auth-input-group">
            <label style={{fontSize: '0.8rem', color: '#64748b'}}>Birthdate</label>
            <input className="auth-input" name="customer_birthdate" type="date" onChange={handleChange} />
          </div>
          <div className="auth-input-group">
            <input className="auth-input" name="username" placeholder="Username" onChange={handleChange} />
          </div>
          <div className="auth-input-group">
            <input className="auth-input" name="password" type="password" placeholder="Password" onChange={handleChange} />
          </div>

          <button className="auth-button" onClick={handleRegister}>Register</button>
          
          <div className="auth-footer">
            Already have an account? <span className="auth-link" onClick={onSwitch}>Log in</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register