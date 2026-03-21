import { NavLink } from 'react-router-dom'
import useCustomer from '../hooks/useCustomer'

const links = [
  { to: '/', label: 'Home' },
  { to: '/tickets', label: 'Tickets' },
  { to: '/memberships', label: 'Memberships' },
  { to: '/queue', label: 'Virtual Queue' },
  { to: '/dining', label: 'Dining' },
  { to: '/shops', label: 'Shops' },
  { to: '/shows', label: 'Shows' },
  { to: '/feedback', label: 'Feedback' }
]

function Navbar() {
  const { cartCount } = useCustomer()

  return (
    <header className="navbar">
      <div className="navbar-top">
        <NavLink to="/" className="nav-brand">
          ThemePark Radical
        </NavLink>

        <div className="nav-status">
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `nav-link${isActive ? ' nav-link-active' : ''}`
            }
          >
            Account
          </NavLink>
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
