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
  [ROLES.GENERAL_MANAGER]: '/admin/general-manager',
  [ROLES.MAINTENANCE]: '/admin/maintenance',
  [ROLES.RIDE_ATTENDANT_MANAGER]: '/admin/ride-attendant',
  [ROLES.PARKING_LOT_MANAGER]: '/admin/parking',
  [ROLES.TICKET_SELLER]: '/admin/ticket-seller',
  [ROLES.RESTAURANT_MANAGER]: '/admin/restaurant',
  [ROLES.SHOP_MANAGER]: '/admin/shop',
  [ROLES.SHOWS_MANAGER]: '/admin/shows'
}

export const ROLE_ROUTES = {
  [ROLES.CUSTOMER]: '/dashboard',
  [ROLES.GENERAL_MANAGER]: '/employee',
  [ROLES.MAINTENANCE]: '/employee',
  [ROLES.RIDE_ATTENDANT_MANAGER]: '/employee',
  [ROLES.PARKING_LOT_MANAGER]: '/employee',
  [ROLES.TICKET_SELLER]: '/employee',
  [ROLES.RESTAURANT_MANAGER]: '/employee',
  [ROLES.SHOP_MANAGER]: '/employee',
  [ROLES.SHOWS_MANAGER]: '/employee'
}