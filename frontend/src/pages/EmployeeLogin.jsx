import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import { ROLES, ALL_EMPLOYEES } from '../constants/roles.js'

import Login from './Login.jsx'
import CustomerDash from './CustomerDash.jsx'
import EmployeeDash from './EmployeeDash.jsx'
import GMDash from './GMDash.jsx'
import MaintenanceDash from './admin/MaintenanceDash.jsx'
import RideAttendantDash from './admin/RideAttendantDash.jsx'
import ParkingDash from './admin/ParkingDash.jsx'
import TicketSellerDash from './admin/TicketSellerDash.jsx'
import RestaurantDash from './admin/RestaurantDash.jsx'
import ShopDash from './admin/ShopDash.jsx'
import ShowsDash from './admin/ShowsDash.jsx'

function EmployeeLogin() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <CustomerDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="employee"
        element={
          <ProtectedRoute allowedRoles={ALL_EMPLOYEES}>
            <EmployeeDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/general-manager"
        element={
          <ProtectedRoute allowedRoles={[ROLES.GENERAL_MANAGER]}>
            <GMDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/maintenance"
        element={
          <ProtectedRoute allowedRoles={[ROLES.MAINTENANCE]}>
            <MaintenanceDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/ride-attendant"
        element={
          <ProtectedRoute allowedRoles={[ROLES.RIDE_ATTENDANT_MANAGER]}>
            <RideAttendantDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/parking"
        element={
          <ProtectedRoute allowedRoles={[ROLES.PARKING_LOT_MANAGER]}>
            <ParkingDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/ticket-seller"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TICKET_SELLER]}>
            <TicketSellerDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/restaurant"
        element={
          <ProtectedRoute allowedRoles={[ROLES.RESTAURANT_MANAGER]}>
            <RestaurantDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/shop"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SHOP_MANAGER]}>
            <ShopDash />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/shows"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SHOWS_MANAGER]}>
            <ShowsDash />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default EmployeeLogin
