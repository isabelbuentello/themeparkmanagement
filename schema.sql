CREATE TABLE Ride (
  ride_id           INT                         AUTO_INCREMENT                  NOT NULL,
  name              VARCHAR(60)                                                 NOT NULL,
  location_id       CHAR(10)                                                    NOT NULL,
  ride_type         ENUM('rollercoaster', 'water', 'kids')                      NOT NULL,
  is_seasonal       BOOLEAN                                                     NOT NULL,
  size_sqft         INT UNSIGNED                                                NOT NULL,
  lat               DECIMAL(9,6)                                                NOT NULL,
  long              DECIMAL(9,6)                                                NOT NULL,
  speed_mph         INT                                                         CHECK (speed_mph BETWEEN 10 AND 200),
  min_height_ft     DECIMAL(3,1)                                                CHECK (min_height_ft BETWEEN 0 AND 5),
  affected_by_rain  BOOLEAN                                                     NOT NULL,
  status            ENUM('open', 'broken', 'maintenance', 'closed_weather')     NOT NULL,

  PRIMARY KEY (ride_id),
  FOREIGN KEY (location_id) REFERENCES Location(location_id)
);

CREATE TABLE PassType (
  pass_type_id     INT                          AUTO_INCREMENT                   NOT NULL,
  name             ENUM('fast pass', 'food pass', 'parking pass', 'season pass') NOT NULL,
  description      VARCHAR(100)                                                  NULL,

  PRIMARY KEY (pass_type_id)
);

CREATE TABLE Pass (
  pass_id                INT                    AUTO_INCREMENT                  NOT NULL,
  pass_type_id           INT                                                    NOT NULL,
  customer_id            INT                                                    NOT NULL,
  purchase_date          DATE                                                   NOT NULL,
  quantity_purchased     INT                                                    NOT NULL CHECK (quantity_purchased >= 1),
  quantity_remaining     INT                                                    NOT NULL CHECK (quantity_remaining >= 0),
  status                 ENUM('active', 'expired')                              NOT NULL,

  PRIMARY KEY (pass_id),
  FOREIGN KEY (pass_type_id) REFERENCES PassType(pass_type_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE TicketType (
  ticket_type_id   INT                        AUTO_INCREMENT                   NOT NULL,
  name             ENUM('park entry', 'ride ticket')                           NOT NULL,
  description      VARCHAR(200)                                                NULL,

  PRIMARY KEY (ticket_type_id)
);

CREATE TABLE Ticket (
  ticket_id        INT                        AUTO_INCREMENT                   NOT NULL,
  ticket_type_id   INT                                                         NOT NULL,
  customer_id      INT                                                         NOT NULL,
  valid_date       DATE                                                        NOT NULL,
  status           ENUM('valid', 'used', 'expired')                            NOT NULL,

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

CREATE TABLE `Transaction` (
  transaction_id   INT                      AUTO_INCREMENT                   NOT NULL,
  account_id       INT                                                       NULL,
  transaction_time DATE                                                      NOT NULL,
  total_amount     DECIMAL(10,2)                                             NOT NULL CHECK (total_amount >= 0),
  payment_method   ENUM('cash', 'card')                                      NOT NULL,
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
  FOREIGN KEY (queue_id) REFERENCES VirtualQueue(queue_id)
);

CREATE TABLE Complaint (
  complaint_id             INT                     AUTO_INCREMENT                   NOT NULL,
  customer_id              INT                                                      NULL,
  location_id              INT                                                      NULL,
  venue_id                 INT                                                      NULL,
  description_id           VARCHAR(300)                                             NULL,
  created_date             DATE                                                     NOT NULL,
  resolved                 BOOLEAN                                                  NOT NULL,
  resolved_date            DATE                                                     NOT NULL,

  PRIMARY KEY (complaint_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
  FOREIGN KEY (location_id) REFERENCES Location(location_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE Review (
  review_id                 INT                     AUTO_INCREMENT                    NOT NULL,
  customer_id               INT                                                       NOT NULL,
  ride_id                   INT                                                       NOT NULL,
  venue_id                  INT                                                       NULL,
  rating                    INT                                                       NOT NULL CHECK (rating BETWEEN 1 AND 10)
  comment                   VARCHAR(10000)                                            NULL,
  review_created_date       DATE                                                      NOT NULL,

  PRIMARY KEY (review_id),
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
  FOREIGN KEY (ride_id) REFERENCES Ride(ride_id),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);

CREATE TABLE EmergencyEvent (
  event_id                  INT                      AUTO_INCREMENT                    NOT NULL,
  date_of_emergency         DATE                                                       NOT NULL,
  location_id               INT                                                        NOT NULL,
  event_description         VARCHAR(1000)                                              NOT NULL,

  PRIMARY KEY (event_id),
  FOREIGN KEY (location_id) REFERENCES Location(location_id)
);

CREATE TABLE Show (
  show_id                  INT                        AUTO_INCREMENT                   NOT NULL,
  venue_id                 INT                                                         NOT NULL,
  location_id              INT                                                         NOT NULL,
  category                 ENUM("magician","puppets","clown")                          NOT NULL,
  duration                 INT                                                         NOT NULL CHECK (duration BETWEEN 0 AND 120),

  PRIMARY KEY (show_id),
  FOREIGN KEY (location_id) REFERENCES Location(location_id)
);
CREATE TABLE ShowTime (
  show_time               INT                          AUTO_INCREMENT                  NOT NULL,
  show_id                 INT                                                          NOT NULL,
  show_start_time         DATETIME                                                     NOT NULL,

  PRIMARY KEY (show_time),
  FOREIGN KEY  (show_id) REFERENCES Show(show_id)
);

CREATE TABLE DailyRevenue (
  date_of_revenue          DATE                        AUTO_INCREMENT                  NOT NULL,
  venue_id                 INT                                                         NOT NULL,
  revenue                  INT(UNSIGNED)                                               NOT NULL,

  PRIMARY KEY (date_of_revenue),
  FOREIGN KEY (venue_id) REFERENCES Venue(venue_id)
);