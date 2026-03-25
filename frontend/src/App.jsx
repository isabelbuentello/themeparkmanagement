import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ROLES, ALL_EMPLOYEES } from './constants/roles'
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
        <ProtectedRoute allowedRoles={[ROLES.MAINTENANCE, ROLES.GENERAL_MANAGER]}>
          <MaintenanceDash />
        </ProtectedRoute>
      } />

      <Route path="/admin/ride-attendant" element={
        <ProtectedRoute allowedRoles={[ROLES.RIDE_ATTENDANT_MANAGER, ROLES.GENERAL_MANAGER]}>
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
    </Routes>
  )
}

export default App