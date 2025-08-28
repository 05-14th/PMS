-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: mysql-chickmate.alwaysdata.net
-- Generation Time: Aug 19, 2025 at 04:57 PM
-- Server version: 10.11.13-MariaDB
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `chickmate_poultrydb`
--

-- --------------------------------------------------------

--
-- Table structure for table `cm_batches`
--

CREATE TABLE `cm_batches` (
  `BatchID` int(11) NOT NULL,
  `StartDate` date NOT NULL,
  `ExpectedHarvestDate` date NOT NULL,
  `TotalChicken` int(11) NOT NULL,
  `CurrentChicken` int(11) NOT NULL,
  `Status` enum('Active','Sold','','') NOT NULL,
  `Notes` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cm_batches`
--

INSERT INTO `cm_batches` (`BatchID`, `StartDate`, `ExpectedHarvestDate`, `TotalChicken`, `CurrentChicken`, `Status`, `Notes`) VALUES
(1, '2025-07-05', '2025-08-01', 209, 0, 'Sold', 'Batch 1 - Initial batch of chicks');

-- --------------------------------------------------------

--
-- Table structure for table `cm_harvest`
--

CREATE TABLE `cm_harvest` (
  `HarvestID` int(11) NOT NULL,
  `BatchID` int(11) NOT NULL,
  `HarvestDate` date NOT NULL,
  `Notes` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cm_harvest`
--

INSERT INTO `cm_harvest` (`HarvestID`, `BatchID`, `HarvestDate`, `Notes`) VALUES
(1, 1, '2025-08-01', 'First culling'),
(2, 1, '2025-08-05', 'Second culling'),
(3, 1, '2025-08-10', 'Third culling'),
(4, 1, '2025-08-13', 'Fourth culling'),
(5, 1, '2025-08-08', 'Live sale - 15 chickens');

-- --------------------------------------------------------

--
-- Table structure for table `cm_harvest_details`
--

CREATE TABLE `cm_harvest_details` (
  `HDetailID` int(11) NOT NULL,
  `HarvestID` int(11) NOT NULL,
  `SaleType` enum('Culled','Live','','') NOT NULL,
  `BirdQuantity` int(11) NOT NULL,
  `TotalWeightKg` decimal(10,2) NOT NULL,
  `PricePerKg` decimal(10,2) NOT NULL,
  `SalesAmount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cm_harvest_details`
--

INSERT INTO `cm_harvest_details` (`HDetailID`, `HarvestID`, `SaleType`, `BirdQuantity`, `TotalWeightKg`, `PricePerKg`, `SalesAmount`) VALUES
(1, 1, 'Culled', 50, 61.00, 220.00, 13420.00),
(2, 2, 'Culled', 50, 67.00, 220.00, 14740.00),
(3, 3, 'Culled', 50, 74.00, 220.00, 16280.00),
(4, 4, 'Culled', 36, 60.00, 220.00, 13200.00),
(5, 5, 'Live', 15, 28.00, 160.00, 4480.00);

-- --------------------------------------------------------

--
-- Table structure for table `cm_inventory`
--

CREATE TABLE `cm_inventory` (
  `ItemID` int(11) NOT NULL,
  `ItemName` varchar(50) NOT NULL,
  `Category` enum('Feed','Medicine','Chemical','Miscellaneous') NOT NULL,
  `Unit` enum('pcs','grams','liter','kg') NOT NULL,
  `Quantity` decimal(10,2) NOT NULL,
  `UnitCost` decimal(10,2) NOT NULL,
  `SupplierID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cm_inventory`
--

INSERT INTO `cm_inventory` (`ItemID`, `ItemName`, `Category`, `Unit`, `Quantity`, `UnitCost`, `SupplierID`) VALUES
(1, 'B-MEG Integra 1000', 'Feed', 'kg', 150.00, 1900.00, 2),
(2, 'B-MEG Integra 2000', 'Feed', 'kg', 500.00, 1700.00, 2),
(3, 'Vitminpro', 'Medicine', 'pcs', 10.00, 200.00, 2);

-- --------------------------------------------------------

--
-- Table structure for table `cm_inventory_usage`
--

CREATE TABLE `cm_inventory_usage` (
  `UsageID` int(11) NOT NULL,
  `BatchID` int(11) DEFAULT NULL,
  `ItemID` int(11) NOT NULL,
  `Date` date NOT NULL,
  `QuantityUsed` decimal(10,2) NOT NULL,
  `Unit` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cm_inventory_usage`
--

INSERT INTO `cm_inventory_usage` (`UsageID`, `BatchID`, `ItemID`, `Date`, `QuantityUsed`, `Unit`) VALUES
(2, 1, 1, '2025-07-19', 111.82, 'kg'),
(3, 1, 2, '2025-08-01', 68.60, 'kg'),
(4, 1, 2, '2025-08-05', 99.15, 'kg'),
(5, 1, 2, '2025-08-08', 37.44, 'kg'),
(6, 1, 2, '2025-08-10', 143.05, 'kg'),
(7, 1, 2, '2025-08-12', 116.71, 'kg');

--
-- Triggers `cm_inventory_usage`
--
DELIMITER $$
CREATE TRIGGER `after_inventory_usage_insert` AFTER INSERT ON `cm_inventory_usage` FOR EACH ROW BEGIN
    DECLARE cost DECIMAL(10,2);

    -- Get the unit cost from inventory
    SELECT UnitCost INTO cost
    FROM cm_inventory
    WHERE ItemID = NEW.ItemID;

    -- Insert into production cost
    INSERT INTO cm_production_cost (BatchID, ItemID, QuantityUsed, UnitCost, TotalCost)
    VALUES (NEW.BatchID, NEW.ItemID, NEW.QuantityUsed, cost, NEW.QuantityUsed * cost);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `cm_mortality`
--

CREATE TABLE `cm_mortality` (
  `MortalityID` int(11) NOT NULL,
  `BatchID` int(11) NOT NULL,
  `Date` date NOT NULL,
  `BirdsLoss` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cm_mortality`
--

INSERT INTO `cm_mortality` (`MortalityID`, `BatchID`, `Date`, `BirdsLoss`) VALUES
(1, 1, '2025-08-13', 8);

-- --------------------------------------------------------

--
-- Table structure for table `cm_production_cost`
--

CREATE TABLE `cm_production_cost` (
  `CostID` int(11) NOT NULL,
  `BatchID` int(11) NOT NULL,
  `ItemID` int(11) DEFAULT NULL,
  `Date` date NOT NULL,
  `CostType` varchar(50) NOT NULL,
  `Amount` decimal(10,2) NOT NULL,
  `Description` text NOT NULL,
  `SupplierID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cm_production_cost`
--

INSERT INTO `cm_production_cost` (`CostID`, `BatchID`, `ItemID`, `Date`, `CostType`, `Amount`, `Description`, `SupplierID`) VALUES
(1, 1, NULL, '2025-07-05', 'Chick Purchase', 10000.00, '209 chicks purchased', 1);

-- --------------------------------------------------------

--
-- Table structure for table `cm_suppliers`
--

CREATE TABLE `cm_suppliers` (
  `SupplierID` int(11) NOT NULL,
  `SupplierName` varchar(255) NOT NULL,
  `ContactPerson` varchar(255) DEFAULT NULL,
  `PhoneNumber` varchar(50) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `Address` text DEFAULT NULL,
  `Notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cm_suppliers`
--

INSERT INTO `cm_suppliers` (`SupplierID`, `SupplierName`, `ContactPerson`, `PhoneNumber`, `Email`, `Address`, `Notes`) VALUES
(1, 'JT Agri', NULL, NULL, NULL, NULL, NULL),
(2, 'E & J Hogs and Poultry Supply Store', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cm_users`
--

DROP TABLE IF EXISTS `cm_users`;

CREATE TABLE `cm_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `profile_pic` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cm_batches`
--
ALTER TABLE `cm_batches`
  ADD PRIMARY KEY (`BatchID`);

--
-- Indexes for table `cm_harvest`
--
ALTER TABLE `cm_harvest`
  ADD PRIMARY KEY (`HarvestID`),
  ADD KEY `BatchID` (`BatchID`);

--
-- Indexes for table `cm_harvest_details`
--
ALTER TABLE `cm_harvest_details`
  ADD PRIMARY KEY (`HDetailID`),
  ADD KEY `HarvestID` (`HarvestID`);

--
-- Indexes for table `cm_inventory`
--
ALTER TABLE `cm_inventory`
  ADD PRIMARY KEY (`ItemID`),
  ADD KEY `fk_inventory_supplier` (`SupplierID`);

--
-- Indexes for table `cm_inventory_usage`
--
ALTER TABLE `cm_inventory_usage`
  ADD PRIMARY KEY (`UsageID`),
  ADD KEY `BatchID` (`BatchID`),
  ADD KEY `fk_usage_inventory` (`ItemID`);

--
-- Indexes for table `cm_mortality`
--
ALTER TABLE `cm_mortality`
  ADD PRIMARY KEY (`MortalityID`),
  ADD KEY `BatchID` (`BatchID`);

--
-- Indexes for table `cm_production_cost`
--
ALTER TABLE `cm_production_cost`
  ADD PRIMARY KEY (`CostID`),
  ADD KEY `BatchID` (`BatchID`),
  ADD KEY `fk_production_supplier` (`SupplierID`),
  ADD KEY `fk_production_inventory` (`ItemID`);

--
-- Indexes for table `cm_suppliers`
--
ALTER TABLE `cm_suppliers`
  ADD PRIMARY KEY (`SupplierID`);

--
-- Indexes for table `cm_users`
--
ALTER TABLE `cm_users`
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cm_batches`
--
ALTER TABLE `cm_batches`
  MODIFY `BatchID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `cm_harvest`
--
ALTER TABLE `cm_harvest`
  MODIFY `HarvestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `cm_harvest_details`
--
ALTER TABLE `cm_harvest_details`
  MODIFY `HDetailID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `cm_inventory`
--
ALTER TABLE `cm_inventory`
  MODIFY `ItemID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `cm_inventory_usage`
--
ALTER TABLE `cm_inventory_usage`
  MODIFY `UsageID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `cm_mortality`
--
ALTER TABLE `cm_mortality`
  MODIFY `MortalityID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cm_production_cost`
--
ALTER TABLE `cm_production_cost`
  MODIFY `CostID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `cm_suppliers`
--
ALTER TABLE `cm_suppliers`
  MODIFY `SupplierID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cm_users`
--
ALTER TABLE `cm_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cm_harvest`
--
ALTER TABLE `cm_harvest`
  ADD CONSTRAINT `cm_harvest_ibfk_1` FOREIGN KEY (`BatchID`) REFERENCES `cm_batches` (`BatchID`);

--
-- Constraints for table `cm_harvest_details`
--
ALTER TABLE `cm_harvest_details`
  ADD CONSTRAINT `cm_harvest_details_ibfk_1` FOREIGN KEY (`HarvestID`) REFERENCES `cm_harvest` (`HarvestID`);

--
-- Constraints for table `cm_inventory`
--
ALTER TABLE `cm_inventory`
  ADD CONSTRAINT `fk_inventory_supplier` FOREIGN KEY (`SupplierID`) REFERENCES `cm_suppliers` (`SupplierID`);

--
-- Constraints for table `cm_inventory_usage`
--
ALTER TABLE `cm_inventory_usage`
  ADD CONSTRAINT `cm_inventory_usage_ibfk_1` FOREIGN KEY (`BatchID`) REFERENCES `cm_batches` (`BatchID`),
  ADD CONSTRAINT `cm_inventory_usage_ibfk_2` FOREIGN KEY (`ItemID`) REFERENCES `cm_inventory` (`ItemID`),
  ADD CONSTRAINT `fk_usage_inventory` FOREIGN KEY (`ItemID`) REFERENCES `cm_inventory` (`ItemID`);

--
-- Constraints for table `cm_mortality`
--
ALTER TABLE `cm_mortality`
  ADD CONSTRAINT `cm_mortality_ibfk_1` FOREIGN KEY (`BatchID`) REFERENCES `cm_batches` (`BatchID`);

--
-- Constraints for table `cm_production_cost`
--
ALTER TABLE `cm_production_cost`
  ADD CONSTRAINT `cm_production_cost_ibfk_1` FOREIGN KEY (`BatchID`) REFERENCES `cm_batches` (`BatchID`),
  ADD CONSTRAINT `fk_production_inventory` FOREIGN KEY (`ItemID`) REFERENCES `cm_inventory` (`ItemID`),
  ADD CONSTRAINT `fk_production_supplier` FOREIGN KEY (`SupplierID`) REFERENCES `cm_suppliers` (`SupplierID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
