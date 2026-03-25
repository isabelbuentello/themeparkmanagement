import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Register from '../components/Register.jsx'
import { ROLE_ROUTES } from '../constants/roles'
import '../styles/auth-styles.css'

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
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
        </div>
        <div className="auth-body">
          {error && <div className="error-msg">{error}</div>}
          <div className="auth-input-group">
            <input
              className="auth-input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="auth-input-group">
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button className="auth-button" onClick={handleLogin}>Login</button>
          
          <div className="auth-footer">
            Don't have an account? <span className="auth-link" onClick={() => setShowRegister(true)}>Sign up</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login