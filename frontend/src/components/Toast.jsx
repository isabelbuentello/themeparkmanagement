import { useEffect } from 'react'

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [message])

  if (!message) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      background: '#1e1e2e',
      color: '#fff',
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      border: '1px solid #7c3aed',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      zIndex: 9999,
      maxWidth: '360px',
      fontSize: '0.9rem'
    }}>
      ⚡ {message}
    </div>
  )
}

export default Toast