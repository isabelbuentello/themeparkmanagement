import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { CustomerProvider } from './context/CustomerContext'
import AccountPage from './pages/AccountPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import DirectoryPage from './pages/DirectoryPage'
import FeedbackPage from './pages/FeedbackPage'
import HomePage from './pages/HomePage'
import MembershipPage from './pages/Membership'
import MembershipSummaryPage from './pages/MembershipSummaryPage'
import QueuePage from './pages/QueuePage'
import QueueSummaryPage from './pages/QueueSummaryPage'
import TicketsPage from './pages/TicketsPage'
import VenueDetailPage from './pages/VenueDetailPage'
import './App.css'

function App() {
  return (
    <CustomerProvider>
      <div className="app-shell">
        <Navbar />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/memberships" element={<MembershipPage />} />
            <Route
              path="/memberships/summary"
              element={<MembershipSummaryPage />}
            />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/queue/summary" element={<QueueSummaryPage />} />
            <Route
              path="/dining"
              element={<DirectoryPage category="dining" />}
            />
            <Route
              path="/dining/:itemId"
              element={<VenueDetailPage category="dining" />}
            />
            <Route path="/shops" element={<DirectoryPage category="shops" />} />
            <Route
              path="/shops/:itemId"
              element={<VenueDetailPage category="shops" />}
            />
            <Route path="/shows" element={<DirectoryPage category="shows" />} />
            <Route
              path="/shows/:itemId"
              element={<VenueDetailPage category="shows" />}
            />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/restaurants" element={<Navigate to="/dining" replace />} />
          </Routes>
        </main>
      </div>
    </CustomerProvider>
  )
}

export default App
