import { useState } from 'react'

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
    <div>
      <h2>Create Account</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <input name="first_name"        placeholder="First Name"    onChange={handleChange} />
      <input name="last_name"         placeholder="Last Name"     onChange={handleChange} />
      <input name="customer_email"    placeholder="Email"         onChange={handleChange} />
      <input name="customer_phone"    placeholder="Phone"         onChange={handleChange} />
      <input name="customer_birthdate" type="date"                onChange={handleChange} />
      <input name="username"          placeholder="Username"      onChange={handleChange} />
      <input name="password"          type="password" placeholder="Password" onChange={handleChange} />
      <button onClick={handleRegister}>Register</button>
      <p>Already have an account? <span onClick={onSwitch} style={{ cursor: 'pointer', color: 'blue' }}>Log in</span></p>
    </div>
  )
}

export default Register