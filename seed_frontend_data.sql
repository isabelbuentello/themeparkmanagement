-- Customer-facing seed data used by the frontend flows.
-- Run this after creating the schema if these tables are empty.

INSERT INTO MembershipTier (tier_id, tier_name, discount, price)
VALUES
  (1, 'gold', 10.00, 19.99),
  (2, 'silver', 15.00, 29.99),
  (3, 'platinum', 25.00, 49.99);

INSERT INTO Perk (perk_id, perk_name, perk_description)
VALUES
  (1, 'Free parking', 'Parking access included with membership visits'),
  (2, 'Food discount', 'Discount on select food and drink purchases'),
  (3, 'Priority ride access', 'Shorter standby access on select attractions'),
  (4, 'Member event access', 'Invitations to special park member events'),
  (5, 'Merchandise savings', 'Discount on select in-park merchandise');

INSERT INTO TierPerk (tier_id, perk_id)
VALUES
  (1, 1),
  (1, 2),
  (2, 1),
  (2, 2),
  (2, 5),
  (3, 1),
  (3, 2),
  (3, 3),
  (3, 4),
  (3, 5);

INSERT INTO TicketType (ticket_type_id, ticket_name, ticket_description, price)
VALUES
  (1, 'park entry', 'General park admission ticket', 25.00),
  (2, 'ride ticket', 'Single ride access ticket', 10.00);

INSERT INTO PassType (pass_type_id, pass_name, pass_description)
VALUES
  (1, 'fast pass', 'Priority ride access pass'),
  (2, 'food pass', 'Food purchase pass'),
  (3, 'parking pass', 'Parking access pass'),
  (4, 'season pass', 'Season-long park pass');

INSERT INTO Ride (
  ride_id,
  ride_name,
  ride_type,
  is_seasonal,
  size_sqft,
  ride_lat,
  ride_long,
  speed_mph,
  min_height_ft,
  affected_by_rain,
  status_ride
)
VALUES
  (1, 'Sky Rail Sprint', 'rollercoaster', false, 12000, 29.760400, -95.369800, 65, 4.0, true, 'open'),
  (2, 'Reef Run Rapids', 'water', false, 15000, 29.760900, -95.368900, 40, 3.5, false, 'open'),
  (3, 'Moon Carousel', 'kids', false, 6000, 29.761300, -95.370100, 15, 0.0, false, 'open');

INSERT INTO VirtualQueue (queue_id, ride_id)
VALUES
  (1, 1),
  (2, 2),
  (3, 3);

INSERT INTO Venue (venue_id, venue_type, venue_name, hours, venue_lat, venue_long)
VALUES
  (1, 'restaurant', 'Castle Bites', '10:00 AM - 9:00 PM', 29.760500, -95.369500),
  (2, 'restaurant', 'Rocket Fuel Cafe', '11:00 AM - 8:00 PM', 29.761000, -95.368700),
  (3, 'restaurant', 'Pirates Table', '12:00 PM - 10:00 PM', 29.760200, -95.370200),
  (4, 'shop', 'Radical Outfitters', '9:00 AM - 10:00 PM', 29.760900, -95.369000),
  (5, 'shop', 'Treasure Vault', '10:00 AM - 8:30 PM', 29.759900, -95.370000),
  (6, 'shop', 'Park Prep', '8:30 AM - 9:30 PM', 29.761200, -95.369200),
  (7, 'show', 'Ignite Parade', '2:00 PM and 5:30 PM', 29.760700, -95.369400),
  (8, 'show', 'Midnight Signal', '1:15 PM, 4:15 PM, 7:15 PM', 29.761400, -95.368800),
  (9, 'show', 'Skyfall Symphony', '8:45 PM', 29.760100, -95.370400);

INSERT INTO Restaurant (venue_id, requires_booking, price_range, seating_capacity)
VALUES
  (1, false, 2, 80),
  (2, false, 1, 30),
  (3, true, 3, 120);

INSERT INTO Shop (venue_id, space_for_items_sqft, total_merch_sold)
VALUES
  (4, 2200, 0),
  (5, 1600, 0),
  (6, 1200, 0);

INSERT INTO ParkShow (show_id, venue_id, show_lat, show_long, show_category, duration)
VALUES
  (1, 7, 29.760700, -95.369400, 'musician', 35),
  (2, 8, 29.761400, -95.368800, 'magician', 45),
  (3, 9, 29.760100, -95.370400, 'musician', 20);

INSERT INTO ShowTime (show_time, show_id, show_start_time)
VALUES
  (1, 1, '2026-03-24 14:00:00'),
  (2, 1, '2026-03-24 17:30:00'),
  (3, 2, '2026-03-24 13:15:00'),
  (4, 2, '2026-03-24 16:15:00'),
  (5, 2, '2026-03-24 19:15:00'),
  (6, 3, '2026-03-24 20:45:00');

INSERT INTO MenuItem (menu_item_id, restaurant_venue_id, item_name, price, is_available)
VALUES
  (1, 1, 'Castle Burger Combo', 14.99, true),
  (2, 1, 'Kids Tender Basket', 8.99, true),
  (3, 1, 'Loaded Fries', 6.49, true),
  (4, 2, 'Cold Brew Float', 5.99, true),
  (5, 2, 'Rocket Muffin', 4.49, true),
  (6, 2, 'Berry Smoothie', 6.99, true),
  (7, 3, 'Harbor Pasta', 18.99, true),
  (8, 3, 'Seafood Basket', 21.99, true),
  (9, 3, 'Molten Chocolate Cake', 7.99, true);
