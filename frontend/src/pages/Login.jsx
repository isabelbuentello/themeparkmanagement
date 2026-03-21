import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Register from '../components/Register.jsx'
import { ROLE_ROUTES } from '../constants/roles'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()
      if (!res.ok) { setError(data.message); return }

      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)

      navigate(ROLE_ROUTES[data.role] || '/')

    } catch (err) {
      setError('Something went wrong')
    }
  }

  // show register component if toggled
  if (showRegister) return <Register onSwitch={() => setShowRegister(false)} />

  return (
    <div>
      <h1>Login</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <p>Don't have an account? <span onClick={() => setShowRegister(true)} style={{ cursor: 'pointer', color: 'blue' }}>Sign up</span></p>
    </div>
  )
}

export default Login