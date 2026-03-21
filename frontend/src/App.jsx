import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ROLES, ALL_EMPLOYEES } from './constants/roles'
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
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import CustomerDash from './pages/CustomerDash.jsx'
import EmployeeDash from './pages/EmployeeDash.jsx'
import GMDash from './pages/GMDash.jsx'
import MaintenanceDash from './pages/admin/MaintenanceDash.jsx'
import RideAttendantDash from './pages/admin/RideAttendantDash.jsx'
import ParkingDash from './pages/admin/ParkingDash.jsx'
import TicketSellerDash from './pages/admin/TicketSellerDash.jsx'
import RestaurantDash from './pages/admin/RestaurantDash.jsx'
import ShopDash from './pages/admin/ShopDash.jsx'
import ShowsDash from './pages/admin/ShowsDash.jsx'
import './App.css'

function CustomerLayout() {
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
          <CustomerDash />
        </ProtectedRoute>
      } />

      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={ALL_EMPLOYEES}>
          <EmployeeDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/general-manager" element={
        <ProtectedRoute allowedRoles={[ROLES.GENERAL_MANAGER]}>
          <GMDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/maintenance" element={
        <ProtectedRoute allowedRoles={[ROLES.MAINTENANCE]}>
          <MaintenanceDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/ride-attendant" element={
        <ProtectedRoute allowedRoles={[ROLES.RIDE_ATTENDANT_MANAGER]}>
          <RideAttendantDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/parking" element={
        <ProtectedRoute allowedRoles={[ROLES.PARKING_LOT_MANAGER]}>
          <ParkingDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/ticket-seller" element={
        <ProtectedRoute allowedRoles={[ROLES.TICKET_SELLER]}>
          <TicketSellerDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/restaurant" element={
        <ProtectedRoute allowedRoles={[ROLES.RESTAURANT_MANAGER]}>
          <RestaurantDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/shop" element={
        <ProtectedRoute allowedRoles={[ROLES.SHOP_MANAGER]}>
          <ShopDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/shows" element={
        <ProtectedRoute allowedRoles={[ROLES.SHOWS_MANAGER]}>
          <ShowsDash />
        </ProtectedRoute>
      } />

      <Route path="/*" element={<CustomerLayout />} />
    </Routes>
  )
}

export default App