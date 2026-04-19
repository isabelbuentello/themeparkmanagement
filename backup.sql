-- MySQL dump 10.13  Distrib 8.4.8, for macos15 (arm64)
--
-- Host: localhost    Database: themeparkmanagement
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Account`
--

DROP TABLE IF EXISTS `Account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Account` (
  `account_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `username` varchar(60) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date_created` date NOT NULL,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `username` (`username`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `account_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`),
  CONSTRAINT `account_chk_1` CHECK ((char_length(`password`) >= 10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Account`
--

LOCK TABLES `Account` WRITE;
/*!40000 ALTER TABLE `Account` DISABLE KEYS */;
/*!40000 ALTER TABLE `Account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Complaint`
--

DROP TABLE IF EXISTS `Complaint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Complaint` (
  `complaint_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `venue_id` int DEFAULT NULL,
  `ride_id` int DEFAULT NULL,
  `complaint_description` varchar(300) DEFAULT NULL,
  `created_date` date NOT NULL,
  `resolved` tinyint(1) NOT NULL,
  `resolved_date` date DEFAULT NULL,
  PRIMARY KEY (`complaint_id`),
  KEY `ride_id` (`ride_id`),
  KEY `customer_id` (`customer_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `complaint_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`),
  CONSTRAINT `complaint_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`),
  CONSTRAINT `complaint_ibfk_3` FOREIGN KEY (`venue_id`) REFERENCES `Venue` (`venue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Complaint`
--

LOCK TABLES `Complaint` WRITE;
/*!40000 ALTER TABLE `Complaint` DISABLE KEYS */;
/*!40000 ALTER TABLE `Complaint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Customer`
--

DROP TABLE IF EXISTS `Customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Customer` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(30) NOT NULL,
  `last_name` varchar(30) NOT NULL,
  `customer_birthdate` date NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_email` varchar(80) NOT NULL,
  `customer_address` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customer`
--

LOCK TABLES `Customer` WRITE;
/*!40000 ALTER TABLE `Customer` DISABLE KEYS */;
/*!40000 ALTER TABLE `Customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DailyRevenue`
--

DROP TABLE IF EXISTS `DailyRevenue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DailyRevenue` (
  `date_of_revenue` date NOT NULL,
  `venue_id` int NOT NULL,
  `revenue` int unsigned NOT NULL,
  PRIMARY KEY (`date_of_revenue`,`venue_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `dailyrevenue_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `Venue` (`venue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DailyRevenue`
--

LOCK TABLES `DailyRevenue` WRITE;
/*!40000 ALTER TABLE `DailyRevenue` DISABLE KEYS */;
/*!40000 ALTER TABLE `DailyRevenue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Department`
--

DROP TABLE IF EXISTS `Department`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Department` (
  `department_id` int NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `ride_id` int DEFAULT NULL,
  `venue_id` int DEFAULT NULL,
  PRIMARY KEY (`department_id`),
  KEY `ride_id` (`ride_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `department_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`),
  CONSTRAINT `department_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `Venue` (`venue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Department`
--

LOCK TABLES `Department` WRITE;
/*!40000 ALTER TABLE `Department` DISABLE KEYS */;
/*!40000 ALTER TABLE `Department` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EmergencyEvent`
--

DROP TABLE IF EXISTS `EmergencyEvent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EmergencyEvent` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `date_of_emergency` date NOT NULL,
  `event_lat` decimal(9,6) NOT NULL,
  `event_long` decimal(9,6) NOT NULL,
  `event_description` varchar(1000) NOT NULL,
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EmergencyEvent`
--

LOCK TABLES `EmergencyEvent` WRITE;
/*!40000 ALTER TABLE `EmergencyEvent` DISABLE KEYS */;
/*!40000 ALTER TABLE `EmergencyEvent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Employee`
--

DROP TABLE IF EXISTS `Employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Employee` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(60) NOT NULL,
  `role` enum('maintenance','manager','operator','attendant') NOT NULL,
  `pay_rate` decimal(10,2) NOT NULL,
  `start_date` date NOT NULL,
  `department_id` int NOT NULL,
  `employee_phone` varchar(20) NOT NULL,
  `employee_email` varchar(80) NOT NULL,
  `employee_address` varchar(100) NOT NULL,
  `gender` enum('male','female','non_binary','prefer_not_to_say') NOT NULL,
  `employee_birthdate` date NOT NULL,
  `ssn` char(9) NOT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `ssn` (`ssn`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `Department` (`department_id`),
  CONSTRAINT `employee_chk_1` CHECK ((`pay_rate` > 7.50))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Employee`
--

LOCK TABLES `Employee` WRITE;
/*!40000 ALTER TABLE `Employee` DISABLE KEYS */;
/*!40000 ALTER TABLE `Employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EmployeeRideTraining`
--

DROP TABLE IF EXISTS `EmployeeRideTraining`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EmployeeRideTraining` (
  `employee_id` int NOT NULL,
  `ride_id` int NOT NULL,
  `trained_level` enum('basic','intermediate','advanced') NOT NULL,
  `trained_date` date NOT NULL,
  PRIMARY KEY (`employee_id`,`ride_id`),
  KEY `ride_id` (`ride_id`),
  CONSTRAINT `employeeridetraining_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`employee_id`),
  CONSTRAINT `employeeridetraining_ibfk_2` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EmployeeRideTraining`
--

LOCK TABLES `EmployeeRideTraining` WRITE;
/*!40000 ALTER TABLE `EmployeeRideTraining` DISABLE KEYS */;
/*!40000 ALTER TABLE `EmployeeRideTraining` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MaintenanceLog`
--

DROP TABLE IF EXISTS `MaintenanceLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MaintenanceLog` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `ride_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `issue_description` varchar(500) NOT NULL,
  `status_maintenance` enum('fixed','in-progress','broken') NOT NULL,
  `cost_to_repair` decimal(10,2) DEFAULT NULL,
  `reported_time` datetime NOT NULL,
  `fixed_time` datetime DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `ride_id` (`ride_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `maintenancelog_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`),
  CONSTRAINT `maintenancelog_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MaintenanceLog`
--

LOCK TABLES `MaintenanceLog` WRITE;
/*!40000 ALTER TABLE `MaintenanceLog` DISABLE KEYS */;
/*!40000 ALTER TABLE `MaintenanceLog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Membership`
--

DROP TABLE IF EXISTS `Membership`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Membership` (
  `membership_id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `tier_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status_membership` enum('active','expired','canceled') NOT NULL,
  `auto_renew` tinyint(1) NOT NULL,
  `payment_method_membership` char(4) NOT NULL,
  PRIMARY KEY (`membership_id`),
  KEY `account_id` (`account_id`),
  KEY `tier_id` (`tier_id`),
  CONSTRAINT `membership_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `Account` (`account_id`),
  CONSTRAINT `membership_ibfk_2` FOREIGN KEY (`tier_id`) REFERENCES `MembershipTier` (`tier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Membership`
--

LOCK TABLES `Membership` WRITE;
/*!40000 ALTER TABLE `Membership` DISABLE KEYS */;
/*!40000 ALTER TABLE `Membership` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MembershipTier`
--

DROP TABLE IF EXISTS `MembershipTier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MembershipTier` (
  `tier_id` int NOT NULL AUTO_INCREMENT,
  `tier_name` enum('gold','silver','platinum') NOT NULL,
  `discount` decimal(5,2) NOT NULL,
  PRIMARY KEY (`tier_id`),
  CONSTRAINT `membershiptier_chk_1` CHECK ((`discount` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MembershipTier`
--

LOCK TABLES `MembershipTier` WRITE;
/*!40000 ALTER TABLE `MembershipTier` DISABLE KEYS */;
/*!40000 ALTER TABLE `MembershipTier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MenuItem`
--

DROP TABLE IF EXISTS `MenuItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MenuItem` (
  `menu_item_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_venue_id` int NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `price` decimal(6,2) NOT NULL,
  `is_available` tinyint(1) NOT NULL,
  PRIMARY KEY (`menu_item_id`),
  KEY `restaurant_venue_id` (`restaurant_venue_id`),
  CONSTRAINT `menuitem_ibfk_1` FOREIGN KEY (`restaurant_venue_id`) REFERENCES `Restaurant` (`venue_id`),
  CONSTRAINT `menuitem_chk_1` CHECK ((`price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MenuItem`
--

LOCK TABLES `MenuItem` WRITE;
/*!40000 ALTER TABLE `MenuItem` DISABLE KEYS */;
/*!40000 ALTER TABLE `MenuItem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ParkDay`
--

DROP TABLE IF EXISTS `ParkDay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ParkDay` (
  `day_id` int NOT NULL AUTO_INCREMENT,
  `park_date` date NOT NULL,
  `rain` tinyint(1) NOT NULL,
  `park_closed` tinyint(1) NOT NULL,
  `weather_notes` varchar(500) DEFAULT NULL,
  `total_attendance` int unsigned NOT NULL,
  `employees_clocked_in` int unsigned DEFAULT NULL,
  `employees_expected` int unsigned NOT NULL,
  `estimated_daily_cost` int unsigned DEFAULT NULL,
  PRIMARY KEY (`day_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ParkDay`
--

LOCK TABLES `ParkDay` WRITE;
/*!40000 ALTER TABLE `ParkDay` DISABLE KEYS */;
/*!40000 ALTER TABLE `ParkDay` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ParkingLot`
--

DROP TABLE IF EXISTS `ParkingLot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ParkingLot` (
  `lot_id` int NOT NULL AUTO_INCREMENT,
  `lot_lat` decimal(9,6) NOT NULL,
  `lot_long` decimal(9,6) NOT NULL,
  `lot_name` varchar(60) NOT NULL,
  `total_space_available` int unsigned NOT NULL,
  `hourly_rate` decimal(6,2) NOT NULL,
  `operating_hours` varchar(100) NOT NULL,
  `reserved_employee_spaces` int unsigned NOT NULL,
  PRIMARY KEY (`lot_id`),
  CONSTRAINT `parkinglot_chk_1` CHECK (((`total_space_available` >= 0) and (`total_space_available` < 500))),
  CONSTRAINT `parkinglot_chk_2` CHECK ((`hourly_rate` > 5.00)),
  CONSTRAINT `parkinglot_chk_3` CHECK ((`reserved_employee_spaces` < 200))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ParkingLot`
--

LOCK TABLES `ParkingLot` WRITE;
/*!40000 ALTER TABLE `ParkingLot` DISABLE KEYS */;
/*!40000 ALTER TABLE `ParkingLot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ParkingSession`
--

DROP TABLE IF EXISTS `ParkingSession`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ParkingSession` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `lot_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `entry_time` timestamp NOT NULL,
  `exit_time` timestamp NULL DEFAULT NULL,
  `amount_paid` decimal(6,2) NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `lot_id` (`lot_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `parkingsession_ibfk_1` FOREIGN KEY (`lot_id`) REFERENCES `ParkingLot` (`lot_id`),
  CONSTRAINT `parkingsession_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`),
  CONSTRAINT `parkingsession_chk_1` CHECK ((`amount_paid` between 0 and 500))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ParkingSession`
--

LOCK TABLES `ParkingSession` WRITE;
/*!40000 ALTER TABLE `ParkingSession` DISABLE KEYS */;
/*!40000 ALTER TABLE `ParkingSession` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ParkShow`
--

DROP TABLE IF EXISTS `ParkShow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ParkShow` (
  `show_id` int NOT NULL AUTO_INCREMENT,
  `venue_id` int NOT NULL,
  `show_lat` decimal(9,6) NOT NULL,
  `show_long` decimal(9,6) NOT NULL,
  `show_category` enum('magician','puppets','clown','musician') NOT NULL,
  `duration` int NOT NULL,
  PRIMARY KEY (`show_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `parkshow_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `Venue` (`venue_id`),
  CONSTRAINT `parkshow_chk_1` CHECK ((`duration` between 0 and 120))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ParkShow`
--

LOCK TABLES `ParkShow` WRITE;
/*!40000 ALTER TABLE `ParkShow` DISABLE KEYS */;
/*!40000 ALTER TABLE `ParkShow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Pass`
--

DROP TABLE IF EXISTS `Pass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Pass` (
  `pass_id` int NOT NULL AUTO_INCREMENT,
  `pass_type_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `purchase_date` date NOT NULL,
  `quantity_purchased` int NOT NULL,
  `quantity_remaining` int NOT NULL,
  `status_pass` enum('active','expired') NOT NULL,
  PRIMARY KEY (`pass_id`),
  KEY `pass_type_id` (`pass_type_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `pass_ibfk_1` FOREIGN KEY (`pass_type_id`) REFERENCES `PassType` (`pass_type_id`),
  CONSTRAINT `pass_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`),
  CONSTRAINT `pass_chk_1` CHECK ((`quantity_purchased` >= 1)),
  CONSTRAINT `pass_chk_2` CHECK ((`quantity_remaining` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Pass`
--

LOCK TABLES `Pass` WRITE;
/*!40000 ALTER TABLE `Pass` DISABLE KEYS */;
/*!40000 ALTER TABLE `Pass` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PassType`
--

DROP TABLE IF EXISTS `PassType`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PassType` (
  `pass_type_id` int NOT NULL AUTO_INCREMENT,
  `pass_name` enum('fast pass','food pass','parking pass','season pass') NOT NULL,
  `pass_description` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`pass_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PassType`
--

LOCK TABLES `PassType` WRITE;
/*!40000 ALTER TABLE `PassType` DISABLE KEYS */;
/*!40000 ALTER TABLE `PassType` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Perk`
--

DROP TABLE IF EXISTS `Perk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Perk` (
  `perk_id` int NOT NULL AUTO_INCREMENT,
  `perk_name` varchar(60) NOT NULL,
  `perk_description` text,
  PRIMARY KEY (`perk_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Perk`
--

LOCK TABLES `Perk` WRITE;
/*!40000 ALTER TABLE `Perk` DISABLE KEYS */;
/*!40000 ALTER TABLE `Perk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QueueReservation`
--

DROP TABLE IF EXISTS `QueueReservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `QueueReservation` (
  `reservation_id` int NOT NULL AUTO_INCREMENT,
  `queue_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `reservation_time` datetime NOT NULL,
  `reservation_fulfilled` tinyint(1) NOT NULL,
  PRIMARY KEY (`reservation_id`),
  KEY `customer_id` (`customer_id`),
  KEY `queue_id` (`queue_id`),
  CONSTRAINT `queuereservation_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`),
  CONSTRAINT `queuereservation_ibfk_2` FOREIGN KEY (`queue_id`) REFERENCES `VirtualQueue` (`queue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QueueReservation`
--

LOCK TABLES `QueueReservation` WRITE;
/*!40000 ALTER TABLE `QueueReservation` DISABLE KEYS */;
/*!40000 ALTER TABLE `QueueReservation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Restaurant`
--

DROP TABLE IF EXISTS `Restaurant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Restaurant` (
  `venue_id` int NOT NULL,
  `requires_booking` tinyint(1) NOT NULL,
  `price_range` int NOT NULL,
  `seating_capacity` int unsigned NOT NULL,
  PRIMARY KEY (`venue_id`),
  CONSTRAINT `restaurant_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `Venue` (`venue_id`),
  CONSTRAINT `restaurant_chk_1` CHECK ((`seating_capacity` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Restaurant`
--

LOCK TABLES `Restaurant` WRITE;
/*!40000 ALTER TABLE `Restaurant` DISABLE KEYS */;
/*!40000 ALTER TABLE `Restaurant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Review`
--

DROP TABLE IF EXISTS `Review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Review` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `ride_id` int DEFAULT NULL,
  `venue_id` int DEFAULT NULL,
  `rating` int NOT NULL,
  `comment` varchar(10000) DEFAULT NULL,
  `review_created_date` date NOT NULL,
  PRIMARY KEY (`review_id`),
  KEY `customer_id` (`customer_id`),
  KEY `ride_id` (`ride_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `review_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`),
  CONSTRAINT `review_ibfk_2` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`),
  CONSTRAINT `review_ibfk_3` FOREIGN KEY (`venue_id`) REFERENCES `Venue` (`venue_id`),
  CONSTRAINT `review_chk_1` CHECK ((`rating` between 1 and 10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Review`
--

LOCK TABLES `Review` WRITE;
/*!40000 ALTER TABLE `Review` DISABLE KEYS */;
/*!40000 ALTER TABLE `Review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Ride`
--

DROP TABLE IF EXISTS `Ride`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ride` (
  `ride_id` int NOT NULL AUTO_INCREMENT,
  `ride_name` varchar(60) NOT NULL,
  `ride_type` enum('rollercoaster','water','kids') NOT NULL,
  `is_seasonal` tinyint(1) NOT NULL,
  `size_sqft` int unsigned NOT NULL,
  `ride_lat` decimal(9,6) NOT NULL,
  `ride_long` decimal(9,6) NOT NULL,
  `speed_mph` int NOT NULL,
  `min_height_ft` decimal(3,1) NOT NULL,
  `affected_by_rain` tinyint(1) NOT NULL,
  `status_ride` enum('open','broken','maintenance','closed_weather') NOT NULL,
  PRIMARY KEY (`ride_id`),
  CONSTRAINT `ride_chk_1` CHECK ((`speed_mph` between 10 and 200)),
  CONSTRAINT `ride_chk_2` CHECK ((`min_height_ft` between 0 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Ride`
--

LOCK TABLES `Ride` WRITE;
/*!40000 ALTER TABLE `Ride` DISABLE KEYS */;
/*!40000 ALTER TABLE `Ride` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RideInspection`
--

DROP TABLE IF EXISTS `RideInspection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RideInspection` (
  `inspection_id` int NOT NULL AUTO_INCREMENT,
  `ride_id` int NOT NULL,
  `inspected_on` date NOT NULL,
  `expires_on` date NOT NULL,
  `inspector_id` int NOT NULL,
  `inspection_notes` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`inspection_id`),
  KEY `ride_id` (`ride_id`),
  KEY `inspector_id` (`inspector_id`),
  CONSTRAINT `rideinspection_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`),
  CONSTRAINT `rideinspection_ibfk_2` FOREIGN KEY (`inspector_id`) REFERENCES `Employee` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RideInspection`
--

LOCK TABLES `RideInspection` WRITE;
/*!40000 ALTER TABLE `RideInspection` DISABLE KEYS */;
/*!40000 ALTER TABLE `RideInspection` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RideRainout`
--

DROP TABLE IF EXISTS `RideRainout`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RideRainout` (
  `rainout_id` int NOT NULL AUTO_INCREMENT,
  `ride_id` int NOT NULL,
  `rainout_time` datetime NOT NULL,
  PRIMARY KEY (`rainout_id`),
  KEY `ride_id` (`ride_id`),
  CONSTRAINT `riderainout_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RideRainout`
--

LOCK TABLES `RideRainout` WRITE;
/*!40000 ALTER TABLE `RideRainout` DISABLE KEYS */;
/*!40000 ALTER TABLE `RideRainout` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RidesVisited`
--

DROP TABLE IF EXISTS `RidesVisited`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RidesVisited` (
  `usage_id` int NOT NULL AUTO_INCREMENT,
  `ride_id` int NOT NULL,
  `visit_id` int NOT NULL,
  `start_time` datetime NOT NULL,
  `used_fast_pass` tinyint(1) NOT NULL,
  PRIMARY KEY (`usage_id`),
  KEY `ride_id` (`ride_id`),
  KEY `visit_id` (`visit_id`),
  CONSTRAINT `ridesvisited_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`),
  CONSTRAINT `ridesvisited_ibfk_2` FOREIGN KEY (`visit_id`) REFERENCES `Visit` (`visit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RidesVisited`
--

LOCK TABLES `RidesVisited` WRITE;
/*!40000 ALTER TABLE `RidesVisited` DISABLE KEYS */;
/*!40000 ALTER TABLE `RidesVisited` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Shop`
--

DROP TABLE IF EXISTS `Shop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Shop` (
  `venue_id` int NOT NULL,
  `space_for_items_sqft` int unsigned NOT NULL,
  `total_merch_sold` int unsigned NOT NULL,
  PRIMARY KEY (`venue_id`),
  CONSTRAINT `shop_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `Venue` (`venue_id`),
  CONSTRAINT `shop_chk_1` CHECK ((`space_for_items_sqft` >= 0)),
  CONSTRAINT `shop_chk_2` CHECK ((`total_merch_sold` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Shop`
--

LOCK TABLES `Shop` WRITE;
/*!40000 ALTER TABLE `Shop` DISABLE KEYS */;
/*!40000 ALTER TABLE `Shop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ShowTime`
--

DROP TABLE IF EXISTS `ShowTime`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ShowTime` (
  `show_time` int NOT NULL AUTO_INCREMENT,
  `show_id` int NOT NULL,
  `show_start_time` datetime NOT NULL,
  PRIMARY KEY (`show_time`),
  KEY `show_id` (`show_id`),
  CONSTRAINT `showtime_ibfk_1` FOREIGN KEY (`show_id`) REFERENCES `ParkShow` (`show_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ShowTime`
--

LOCK TABLES `ShowTime` WRITE;
/*!40000 ALTER TABLE `ShowTime` DISABLE KEYS */;
/*!40000 ALTER TABLE `ShowTime` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Ticket`
--

DROP TABLE IF EXISTS `Ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ticket` (
  `ticket_id` int NOT NULL AUTO_INCREMENT,
  `ticket_type_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `valid_date` date NOT NULL,
  `status_ticket` enum('valid','used','expired') NOT NULL,
  PRIMARY KEY (`ticket_id`),
  KEY `ticket_type_id` (`ticket_type_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `ticket_ibfk_1` FOREIGN KEY (`ticket_type_id`) REFERENCES `TicketType` (`ticket_type_id`),
  CONSTRAINT `ticket_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Ticket`
--

LOCK TABLES `Ticket` WRITE;
/*!40000 ALTER TABLE `Ticket` DISABLE KEYS */;
/*!40000 ALTER TABLE `Ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TicketType`
--

DROP TABLE IF EXISTS `TicketType`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TicketType` (
  `ticket_type_id` int NOT NULL AUTO_INCREMENT,
  `ticket_name` enum('park entry','ride ticket') NOT NULL,
  `ticket_description` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`ticket_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TicketType`
--

LOCK TABLES `TicketType` WRITE;
/*!40000 ALTER TABLE `TicketType` DISABLE KEYS */;
/*!40000 ALTER TABLE `TicketType` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TierPerk`
--

DROP TABLE IF EXISTS `TierPerk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TierPerk` (
  `tier_id` int NOT NULL,
  `perk_id` int NOT NULL,
  PRIMARY KEY (`tier_id`,`perk_id`),
  KEY `perk_id` (`perk_id`),
  CONSTRAINT `tierperk_ibfk_1` FOREIGN KEY (`tier_id`) REFERENCES `MembershipTier` (`tier_id`),
  CONSTRAINT `tierperk_ibfk_2` FOREIGN KEY (`perk_id`) REFERENCES `Perk` (`perk_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TierPerk`
--

LOCK TABLES `TierPerk` WRITE;
/*!40000 ALTER TABLE `TierPerk` DISABLE KEYS */;
/*!40000 ALTER TABLE `TierPerk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Transactions`
--

DROP TABLE IF EXISTS `Transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `account_id` int DEFAULT NULL,
  `transaction_time` date NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method_transaction` enum('cash','card') NOT NULL,
  `venue_id` int DEFAULT NULL,
  PRIMARY KEY (`transaction_id`),
  KEY `account_id` (`account_id`),
  KEY `venue_id` (`venue_id`),
  CONSTRAINT `transaction_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `Account` (`account_id`),
  CONSTRAINT `transaction_ibfk_2` FOREIGN KEY (`venue_id`) REFERENCES `Venue` (`venue_id`),
  CONSTRAINT `transaction_chk_1` CHECK ((`total_amount` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Transactions`
--

LOCK TABLES `Transactions` WRITE;
/*!40000 ALTER TABLE `Transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `Transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TransactionItem`
--

DROP TABLE IF EXISTS `TransactionItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TransactionItem` (
  `transaction_item_id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` int NOT NULL,
  `item_type` enum('ticket','pass','merch','food','other') NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`transaction_item_id`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `transactionitem_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `Transactions` (`transaction_id`),
  CONSTRAINT `transactionitem_chk_1` CHECK ((`quantity` >= 1)),
  CONSTRAINT `transactionitem_chk_2` CHECK ((`unit_price` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TransactionItem`
--

LOCK TABLES `TransactionItem` WRITE;
/*!40000 ALTER TABLE `TransactionItem` DISABLE KEYS */;
/*!40000 ALTER TABLE `TransactionItem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Venue`
--

DROP TABLE IF EXISTS `Venue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Venue` (
  `venue_id` int NOT NULL AUTO_INCREMENT,
  `venue_type` enum('shop','restaurant','show') NOT NULL,
  `venue_name` varchar(60) NOT NULL,
  `hours` varchar(100) NOT NULL,
  `venue_lat` decimal(9,6) NOT NULL,
  `venue_long` decimal(9,6) NOT NULL,
  PRIMARY KEY (`venue_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Venue`
--

LOCK TABLES `Venue` WRITE;
/*!40000 ALTER TABLE `Venue` DISABLE KEYS */;
/*!40000 ALTER TABLE `Venue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `VirtualQueue`
--

DROP TABLE IF EXISTS `VirtualQueue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `VirtualQueue` (
  `queue_id` int NOT NULL AUTO_INCREMENT,
  `ride_id` int NOT NULL,
  PRIMARY KEY (`queue_id`),
  UNIQUE KEY `ride_id` (`ride_id`),
  CONSTRAINT `virtualqueue_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `Ride` (`ride_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VirtualQueue`
--

LOCK TABLES `VirtualQueue` WRITE;
/*!40000 ALTER TABLE `VirtualQueue` DISABLE KEYS */;
/*!40000 ALTER TABLE `VirtualQueue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Visit`
--

DROP TABLE IF EXISTS `Visit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Visit` (
  `visit_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `visit_date` date NOT NULL,
  `entry_time` datetime NOT NULL,
  PRIMARY KEY (`visit_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `visit_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Visit`
--

LOCK TABLES `Visit` WRITE;
/*!40000 ALTER TABLE `Visit` DISABLE KEYS */;
/*!40000 ALTER TABLE `Visit` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-04 18:26:45
