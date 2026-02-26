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

