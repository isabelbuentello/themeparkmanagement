CREATE TABLE  Customer (
  customer_id   INT       AUTO_INCREMENT                        NOT NULL,
  first_name    VARCHAR(30)                                     NOT NULL,
  last_name     VARCHAR(30)                                     NOT NULL,
  customer_birthdate     DATE                                   NOT NULL,
  customer_phone         VARCHAR(20)                            NOT NULL,
  customer_email         VARCHAR(80)                            NOT NULL,
  customer_address       VARCHAR(100)                           NULL,

  PRIMARY KEY (customer_id)
);

CREATE TABLE MembershipTier (
  tier_id       INT       AUTO_INCREMENT                            NOT NULL,
  tier_name     ENUM('gold', 'silver', 'platinum')                  NOT NULL,
  discount      DECIMAL(5,2)                                        NOT NULL CHECK (discount BETWEEN 0 AND 100),

  PRIMARY KEY (tier_id)
);

CREATE TABLE Perk (
  perk_id       INT       AUTO_INCREMENT                        NOT NULL,
  perk_name     VARCHAR(60)                                         NOT NULL,
  perk_description   TEXT                                                NULL,

  PRIMARY KEY (perk_id)
);


CREATE TABLE ParkDay (
  day_id            INT                         AUTO_INCREMENT                  NOT NULL,
  park_date         DATE                                                        NOT NULL,
  rain              BOOLEAN                                                     NOT NULL,
  park_closed       BOOLEAN                                                     NOT NULL,
  weather_notes     VARCHAR(500)                                                NULL,
  total_attendance  INT UNSIGNED                                                NOT NULL,
  employees_clocked_in      INT UNSIGNED                                        NULL,
  employees_expected        INT UNSIGNED                                        NOT NULL,
  estimated_daily_cost      INT UNSIGNED                                        NULL,
  PRIMARY KEY (day_id)
);

CREATE TABLE PassType (
  pass_type_id     INT                          AUTO_INCREMENT                   NOT NULL,
  pass_name         ENUM('fast pass', 'food pass', 'parking pass', 'season pass', 'rides pass') NOT NULL,
  pass_description   VARCHAR(100)                                                  NULL,
  price            DECIMAL(10,2)                                                 NOT NULL,
  PRIMARY KEY (pass_type_id)
);

CREATE TABLE TicketType (
  ticket_type_id   INT                        AUTO_INCREMENT                   NOT NULL,
  ticket_name             ENUM('park entry', 'ride ticket')                           NOT NULL,
  ticket_description      VARCHAR(200)                                                NULL,

  PRIMARY KEY (ticket_type_id)
);

CREATE TABLE Account (
  account_id    INT       AUTO_INCREMENT                        NOT NULL,
  customer_id   INT                                            NOT NULL,
  username      VARCHAR(60)                                         NOT NULL UNIQUE,
  password      VARCHAR(255)                                        NOT NULL CHECK (CHAR_LENGTH(password) >= 10),
  date_created  DATE                                                NOT NULL,

  PRIMARY KEY (account_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE Visit (
  visit_id        INT     AUTO_INCREMENT                        NOT NULL,
  customer_id     INT                                          NOT NULL,
  visit_date      DATE                                              NOT NULL,
  entry_time      DATETIME                                          NOT NULL,

  PRIMARY KEY (visit_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE TierPerk (
  tier_id       INT                                             NOT NULL,
  perk_id       INT                                             NOT NULL,

  PRIMARY KEY (tier_id, perk_id),
  FOREIGN KEY (tier_id) REFERENCES MembershipTier(tier_id),
  FOREIGN KEY (perk_id) REFERENCES Perk(perk_id)
);

CREATE TABLE Venue (
  venue_id         INT                          AUTO_INCREMENT                  NOT NULL, 
  venue_type       ENUM('shop', 'restaurant', 'show')                           NOT NULL,
  venue_name       VARCHAR(60)                                                  NOT NULL,
  hours            VARCHAR(100)                                                    NOT NULL,
  venue_lat        DECIMAL(9,6)                                                 NOT NULL,
  venue_long       DECIMAL(9,6)                                                 NOT NULL,

  PRIMARY KEY (venue_id)
);

CREATE TABLE Ride (
  ride_id           INT                         AUTO_INCREMENT                  NOT NULL,
  ride_name         VARCHAR(60)                                            NOT NULL,
  ride_type         ENUM('rollercoaster', 'water', 'kids')                      NOT NULL,
  is_seasonal       BOOLEAN                                                     NOT NULL,
  size_sqft         INT UNSIGNED                                                NOT NULL,
  ride_lat          DECIMAL(9,6)                                                NOT NULL,
  ride_long         DECIMAL(9,6)                                                NOT NULL,
  speed_mph         INT                                                         NOT NULL CHECK (speed_mph BETWEEN 10 AND 200),
  min_height_ft     DECIMAL(3,1)                                                NOT NULL CHECK (min_height_ft BETWEEN 0 AND 5),
  affected_by_rain  BOOLEAN                                                     NOT NULL,
  status_ride            ENUM('open', 'broken', 'maintenance', 'closed_weather')     NOT NULL,

  PRIMARY KEY (ride_id)
);

CREATE TABLE Department (
  department_id            INT                       AUTO_INCREMENT                    NOT NULL,
  department_name          VARCHAR(100)                                                NOT NULL,
  ride_id                  INT                                                         NULL,
  venue_id                 INT                                                         NULL,

  PRIMARY KEY (department_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE Employee (
  employee_id       INT                         AUTO_INCREMENT                  NOT NULL,
  full_name         VARCHAR(60)                                                 NOT NULL,
  role              ENUM('general_manager', 'maintenance', 'ride_attendant_manager', 'parking_lot_manager', 'ticket_seller', 'restaurant_manager', 'shop_manager', 'shows_manager')     NOT NULL,
  pay_rate          DECIMAL(10,2)                                               NOT NULL CHECK (pay_rate > 7.50),
  start_date        DATE                                                        NOT NULL,
  department_id     INT                                                 NOT NULL,
  employee_phone    VARCHAR(20)                                                 NOT NULL,
  employee_email    VARCHAR(80)                                                 NOT NULL,
  employee_address  VARCHAR(100)                                                NOT NULL,
  gender            ENUM('male', 'female', 'non_binary', 'prefer_not_to_say')   NOT NULL,
  employee_birthdate         DATE                                                        NOT NULL,
  ssn               CHAR(9)                                                     NOT NULL UNIQUE,
  PRIMARY KEY (employee_id),
  FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

CREATE TABLE EmployeeAccount (
  account_id    INT           AUTO_INCREMENT                NOT NULL,
  employee_id   INT                                        NOT NULL,
  username      VARCHAR(60)                                NOT NULL UNIQUE,
  password      VARCHAR(255)                              NOT NULL,
  PRIMARY KEY (account_id),
  FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

CREATE TABLE RideRainout (
  rainout_id       INT                          AUTO_INCREMENT                  NOT NULL,
  ride_id          INT                                                          NOT NULL,
  rainout_time     DATETIME                                                     NOT NULL,
  PRIMARY KEY (rainout_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id)
);

CREATE TABLE VirtualQueue (
  queue_id                   INT                 AUTO_INCREMENT              NOT NULL,
  ride_id                    INT                                             NOT NULL,

  PRIMARY KEY (queue_id),
  UNIQUE (ride_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id)
);

CREATE TABLE ParkingLot (
  lot_id                      INT                 AUTO_INCREMENT               NOT NULL,
  lot_lat                     DECIMAL(9,6)                                     NOT NULL,
  lot_long                    DECIMAL(9,6)                                     NOT NULL,
  lot_name                    VARCHAR(60)                                      NOT NULL,
  total_space_available       INT UNSIGNED                                     NOT NULL CHECK (total_space_available >= 0 AND total_space_available < 500),
  hourly_rate                 DECIMAL(6,2)                                     NOT NULL CHECK (hourly_rate > 5.00),
  operating_hours             VARCHAR(100)                                     NOT NULL,
  reserved_employee_spaces    INT UNSIGNED                                     NOT NULL CHECK (reserved_employee_spaces < 200),

  PRIMARY KEY (lot_id)
);

CREATE TABLE EmergencyEvent (
  event_id                  INT                      AUTO_INCREMENT                    NOT NULL,
  date_of_emergency         DATE                                                       NOT NULL,
  event_lat                 DECIMAL(9,6)                                               NOT NULL,
  event_long                DECIMAL(9,6)                                               NOT NULL,
  event_description         VARCHAR(1000)                                              NOT NULL,

  PRIMARY KEY (event_id)
);

CREATE TABLE Membership (
  membership_id   INT     AUTO_INCREMENT                        NOT NULL,
  account_id      INT                                          NOT NULL,
  tier_id         INT                                          NOT NULL,
  start_date      DATE                                              NOT NULL,
  end_date        DATE                                              NOT NULL,
  status_membership          ENUM('active', 'expired', 'canceled')             NOT NULL,
  auto_renew      BOOLEAN                                           NOT NULL,
  payment_method_membership  CHAR(4)                                           NOT NULL,

  PRIMARY KEY (membership_id),
  FOREIGN KEY (account_id) REFERENCES Account(account_id),
  FOREIGN KEY (tier_id) REFERENCES MembershipTier(tier_id)
);

CREATE TABLE EmployeeRideTraining (
  employee_id       INT                                                         NOT NULL,
  ride_id           INT                                                         NOT NULL,
  trained_level     ENUM('basic', 'intermediate', 'advanced')                   NOT NULL,
  trained_date      DATE                                                        NOT NULL,
  PRIMARY KEY (employee_id, ride_id),
  FOREIGN KEY (employee_id) REFERENCES Employee(employee_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id)
);

CREATE TABLE MaintenanceRequest (
  request_id                 INT                         AUTO_INCREMENT                  NOT NULL,
  ride_id                    INT                                                         NOT NULL,
  submitted_by_employee_id   INT                                                         NULL,
  issue_description          VARCHAR(500)                                                NOT NULL,
  priority                   ENUM('low', 'medium', 'high')                              NOT NULL DEFAULT 'medium',
  status_request             ENUM('new', 'assigned', 'in_progress', 'resolved')         NOT NULL DEFAULT 'new',
  assigned_to_employee_id    INT                                                         NULL,
  created_time               DATETIME                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time               DATETIME                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (submitted_by_employee_id) REFERENCES Employee(employee_id),
  FOREIGN KEY (assigned_to_employee_id) REFERENCES Employee(employee_id)
);

CREATE TABLE TrainingApprovalRequest (
  training_request_id        INT                         AUTO_INCREMENT                  NOT NULL,
  employee_id                INT                                                         NOT NULL,
  ride_id                    INT                                                         NOT NULL,
  requested_level            ENUM('basic', 'intermediate', 'advanced')                  NOT NULL,
  status_training_request    ENUM('pending', 'approved', 'rejected')                    NOT NULL DEFAULT 'pending',
  requested_time             DATETIME                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_employee_id    INT                                                         NULL,
  reviewed_time              DATETIME                                                    NULL,
  PRIMARY KEY (training_request_id),
  FOREIGN KEY (employee_id) REFERENCES Employee(employee_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (reviewed_by_employee_id) REFERENCES Employee(employee_id)
);

CREATE TABLE MaintenanceLog (
  log_id            INT                         AUTO_INCREMENT                  NOT NULL,
  ride_id           INT                                                         NOT NULL,
  employee_id       INT                                                         NOT NULL,
  issue_description VARCHAR(500)                                                NOT NULL,
  status_maintenance            ENUM('fixed', 'in-progress', 'broken')                      NOT NULL,
  cost_to_repair    DECIMAL(10,2)                                               NULL,
  reported_time     DATETIME                                                    NOT NULL,
  fixed_time        DATETIME                                                    NULL,
  PRIMARY KEY (log_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

CREATE TABLE RideInspection (
  inspection_id     INT                         AUTO_INCREMENT                  NOT NULL,
  ride_id           INT                                                         NOT NULL,
  inspected_on      DATE                                                        NOT NULL,
  expires_on        DATE                                                        NOT NULL,
  inspector_id      INT                                                         NOT NULL,
  inspection_notes             VARCHAR(500)                                                NULL,
  PRIMARY KEY (inspection_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (inspector_id) REFERENCES Employee(employee_id)
);

CREATE TABLE Shop (
  venue_id                    INT                                               NOT NULL,
  space_for_items_sqft        INT UNSIGNED                                      NOT NULL CHECK (space_for_items_sqft >= 0),
  total_merch_sold            INT UNSIGNED                                      NOT NULL CHECK (total_merch_sold >= 0),

  PRIMARY KEY (venue_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE Restaurant (
  venue_id                   INT                                               NOT NULL,
  requires_booking           BOOLEAN                                           NOT NULL,
  price_range                INT                                               NOT NULL,
  seating_capacity           INT UNSIGNED                                      NOT NULL CHECK (seating_capacity >= 0),

  PRIMARY KEY (venue_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE MenuItem (
  menu_item_id                INT                 AUTO_INCREMENT               NOT NULL,
  restaurant_venue_id         INT                                              NOT NULL,
  item_name                   VARCHAR(100)                                     NOT NULL,
  price                       DECIMAL(6,2)                                     NOT NULL CHECK (price >= 0),
  is_available                BOOLEAN                                          NOT NULL,

  PRIMARY KEY (menu_item_id),
  FOREIGN KEY (restaurant_venue_id) REFERENCES Restaurant(venue_id)
);

CREATE TABLE ParkShow (
  show_id                  INT                        AUTO_INCREMENT                   NOT NULL,
  venue_id                 INT                                                         NOT NULL,
  show_lat                 DECIMAL(9,6)                                                NOT NULL,
  show_long                DECIMAL(9,6)                                                NOT NULL,
  show_category            ENUM('magician','puppets','clown', 'musician')              NOT NULL,
  duration                 INT                                                         NOT NULL CHECK (duration BETWEEN 0 AND 120),

  PRIMARY KEY (show_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE ShowTime (
  show_time               INT                          AUTO_INCREMENT                  NOT NULL,
  show_id                 INT                                                          NOT NULL,
  show_start_time         DATETIME                                                     NOT NULL,

  PRIMARY KEY (show_time),
  FOREIGN KEY  (show_id) REFERENCES ParkShow(show_id)
);

CREATE TABLE DailyRevenue (
  date_of_revenue          DATE                                                        NOT NULL,
  venue_id                 INT                                                         NOT NULL,
  revenue                  INT UNSIGNED                                                NOT NULL,

  PRIMARY KEY (date_of_revenue, venue_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE ParkingSession (
  session_id                  INT                 AUTO_INCREMENT              NOT NULL,
  lot_id                      INT                                             NOT NULL,
  customer_id                 INT                                             NOT NULL,
  entry_time                  TIMESTAMP                                       NOT NULL,
  exit_time                   TIMESTAMP                                       NULL,
  amount_paid                 DECIMAL(6,2)                                    NOT NULL CHECK (amount_paid BETWEEN 0 AND 500),

  PRIMARY KEY (session_id),
  FOREIGN KEY (lot_id) REFERENCES ParkingLot(lot_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE Pass (
  pass_id                INT                    AUTO_INCREMENT                  NOT NULL,
  pass_type_id           INT                                                    NOT NULL,
  customer_id            INT                                                    NOT NULL,
  purchase_date          DATE                                                   NOT NULL,
  quantity_purchased     INT                                                    NOT NULL CHECK (quantity_purchased >= 1),
  quantity_remaining     INT                                                    NOT NULL CHECK (quantity_remaining >= 0),
  status_pass                 ENUM('active', 'expired')                              NOT NULL,

  PRIMARY KEY (pass_id),
  FOREIGN KEY (pass_type_id) REFERENCES PassType(pass_type_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE Ticket (
  ticket_id        INT                        AUTO_INCREMENT                   NOT NULL,
  ticket_type_id   INT                                                         NOT NULL,
  customer_id      INT                                                         NOT NULL,
  valid_date       DATE                                                        NOT NULL,
  status_ticket           ENUM('valid', 'used', 'expired')                            NOT NULL,

  PRIMARY KEY (ticket_id),
  FOREIGN KEY (ticket_type_id) REFERENCES TicketType(ticket_type_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE RidesVisited (
  usage_id        INT                        AUTO_INCREMENT                   NOT NULL,
  ride_id         INT                                                         NOT NULL,
  visit_id        INT                                                         NOT NULL,
  start_time      DATETIME                                                    NOT NULL,
  used_fast_pass  BOOLEAN                                                     NOT NULL,

  PRIMARY KEY (usage_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (visit_id) REFERENCES Visit(visit_id)
);

CREATE TABLE Review (
  review_id                 INT                     AUTO_INCREMENT                    NOT NULL,
  customer_id               INT                                                       NOT NULL,
  ride_id                   INT                                                       NULL,
  venue_id                  INT                                                       NULL,
  rating                    INT                                                       NOT NULL CHECK (rating BETWEEN 1 AND 10),
  comment                   VARCHAR(10000)                                            NULL,
  review_created_date       DATE                                                      NOT NULL,

  PRIMARY KEY (review_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE `Transaction` (
  transaction_id   INT                      AUTO_INCREMENT                   NOT NULL,
  account_id       INT                                                       NULL,
  transaction_time DATE                                                      NOT NULL,
  total_amount     DECIMAL(10,2)                                             NOT NULL CHECK (total_amount >= 0),
  payment_method_transaction   ENUM('cash', 'card')                                      NOT NULL,
  venue_id         INT                                                       NULL,

  PRIMARY KEY (transaction_id),
  FOREIGN KEY (account_id) REFERENCES Account(account_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE TransactionItem (
  transaction_item_id  INT                 AUTO_INCREMENT                    NOT NULL,
  transaction_id       INT                                                   NOT NULL,
  item_type            ENUM('ticket', 'pass', 'merch', 'food', 'other')      NOT NULL,
  quantity             INT                                                   NOT NULL CHECK (quantity >= 1),
  unit_price           DECIMAL(10,2)                                         NOT NULL CHECK (unit_price > 0),

  PRIMARY KEY (transaction_item_id),
  FOREIGN KEY (transaction_id) REFERENCES `Transaction`(transaction_id)
);

CREATE TABLE QueueReservation (
  reservation_id          INT                     AUTO_INCREMENT                    NOT NULL,
  queue_id                INT                                                       NOT NULL,
  customer_id             INT                                                       NOT NULL,
  reservation_time        DATETIME                                                  NOT NULL,
  reservation_fulfilled   BOOLEAN                                                   NOT NULL,

  PRIMARY KEY (reservation_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
  FOREIGN KEY (queue_id) REFERENCES VirtualQueue(queue_id)
);

CREATE TABLE Complaint (
  complaint_id             INT                     AUTO_INCREMENT                   NOT NULL,
  customer_id              INT                                                      NULL,
  venue_id                 INT                                                      NULL,
  ride_id                  INT                                                      NULL,
  complaint_description    VARCHAR(300)                                      NULL,
  created_date             DATE                                                     NOT NULL,
  resolved                 BOOLEAN                                                  NOT NULL,
  resolved_date            DATE                                                     NULL,

  PRIMARY KEY (complaint_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

-- Triggers
DELIMITER //

CREATE TRIGGER trg_transaction_update_daily_revenue
AFTER INSERT ON `Transaction`
FOR EACH ROW
BEGIN
    IF NEW.venue_id IS NOT NULL THEN
        INSERT INTO DailyRevenue (date_of_revenue, venue_id, revenue)
        VALUES (NEW.transaction_time, NEW.venue_id, NEW.total_amount)
        ON DUPLICATE KEY UPDATE
            revenue = revenue + NEW.total_amount;
    END IF;
END //

DELIMITER ;