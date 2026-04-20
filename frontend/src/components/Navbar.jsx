import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import useCustomer from '../hooks/useCustomer'

const links = [
  { to: '/', label: 'Home' },
  { to: '/tickets', label: 'Tickets' },
  { to: '/memberships', label: 'Memberships' },
  { to: '/rides', label: 'Rides' },
  { to: '/queue', label: 'Virtual Queue' },
  { to: '/dining', label: 'Dining' },
  { to: '/shops', label: 'Shops' },
  { to: '/shows', label: 'Shows' },
  { to: '/feedback', label: 'Feedback' }
]

function Navbar() {
  const { cartCount } = useCustomer()
  const navigate = useNavigate()
  const location = useLocation()
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    role: '',
    customerName: localStorage.getItem('customer-name') || ''
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role') || ''

    setAuthState((currentState) => ({
      ...currentState,
      isLoggedIn: Boolean(token),
      role,
      customerName: role === 'customer'
        ? localStorage.getItem('customer-name') || ''
        : ''
    }))

    if (!token || role !== 'customer') {
      return
    }

    let isMounted = true

    const loadCustomerProfile = async () => {
      try {
        const response = await fetch('/api/customer/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const data = await response.json()

        if (!response.ok || !isMounted) {
          return
        }

        localStorage.setItem('customer-name', data.name || '')
        setAuthState((currentState) => ({
          ...currentState,
          customerName: data.name || ''
        }))
      } catch {
        // Leave the existing indicator as-is if the profile request fails.
      }
    }

    loadCustomerProfile()

    return () => {
      isMounted = false
    }
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('customer-name')
    setAuthState({
      isLoggedIn: false,
      role: '',
      customerName: ''
    })
    navigate('/account')
  }

  const accountLabel = authState.isLoggedIn
    ? authState.role === 'customer'
      ? authState.customerName || 'Signed in'
      : 'Employee Portal'
    : 'Account'
  const accountPath = authState.isLoggedIn
    ? authState.role === 'customer'
      ? '/account/dashboard'
      : '/account/employee'
    : '/account'

  return (
    <header className="navbar">
      <div className="navbar-top">
        <NavLink to="/" className="nav-brand">
          Team6 ThemePark
        </NavLink>

        <div className="nav-status">
          <NavLink
            to={accountPath}
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }
          >
            {accountLabel}
          </NavLink>
          {authState.isLoggedIn ? (
            <button type="button" className="nav-link" onClick={handleLogout}>
              Logout
            </button>
          ) : null}
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }
          >
            Cart {cartCount}
          </NavLink>
        </div>
      </div>

      <nav className="nav-links" aria-label="Primary navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default Navbar
