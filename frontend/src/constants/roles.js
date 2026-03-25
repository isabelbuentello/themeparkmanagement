export const ROLES = {
  CUSTOMER: 'customer',
  GENERAL_MANAGER: 'general_manager',
  MAINTENANCE: 'maintenance',
  RIDE_ATTENDANT_MANAGER: 'ride_attendant_manager',
  PARKING_LOT_MANAGER: 'parking_lot_manager',
  TICKET_SELLER: 'ticket_seller',
  RESTAURANT_MANAGER: 'restaurant_manager',
  SHOP_MANAGER: 'shop_manager',
  SHOWS_MANAGER: 'shows_manager'
}

export const ALL_EMPLOYEES = [
  ROLES.GENERAL_MANAGER,
  ROLES.MAINTENANCE,
  ROLES.RIDE_ATTENDANT_MANAGER,
  ROLES.PARKING_LOT_MANAGER,
  ROLES.TICKET_SELLER,
  ROLES.RESTAURANT_MANAGER,
  ROLES.SHOP_MANAGER,
  ROLES.SHOWS_MANAGER
]

export const DEPARTMENT_ROUTES = {
  [ROLES.GENERAL_MANAGER]: '/account/admin/general-manager',
  [ROLES.MAINTENANCE]: '/account/admin/maintenance',
  [ROLES.RIDE_ATTENDANT_MANAGER]: '/account/admin/ride-attendant',
  [ROLES.PARKING_LOT_MANAGER]: '/account/admin/parking',
  [ROLES.TICKET_SELLER]: '/account/admin/ticket-seller',
  [ROLES.RESTAURANT_MANAGER]: '/account/admin/restaurant',
  [ROLES.SHOP_MANAGER]: '/account/admin/shop',
  [ROLES.SHOWS_MANAGER]: '/account/admin/shows'
}

export const ROLE_ROUTES = {
  [ROLES.CUSTOMER]: '/account/dashboard',
  [ROLES.GENERAL_MANAGER]: '/account/employee',
  [ROLES.MAINTENANCE]: '/account/employee',
  [ROLES.RIDE_ATTENDANT_MANAGER]: '/account/employee',
  [ROLES.PARKING_LOT_MANAGER]: '/account/employee',
  [ROLES.TICKET_SELLER]: '/account/employee',
  [ROLES.RESTAURANT_MANAGER]: '/account/employee',
  [ROLES.SHOP_MANAGER]: '/account/employee',
  [ROLES.SHOWS_MANAGER]: '/account/employee'
}
