-- MRT Wholesale Platform Database Schema (MySQL)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+05:30";

-- 1. Vendors Table (For future reselling/multi-tenant)
CREATE TABLE `vendors` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `primary_color` varchar(20) DEFAULT '#4f46e5',
  `logo_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Clients Table
CREATE TABLE `clients` (
  `id` varchar(50) NOT NULL,
  `clientNumber` varchar(20) NOT NULL,
  `companyName` varchar(150) NOT NULL,
  `contactPerson` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` text NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT 'client123',
  `firstLogin` tinyint(1) NOT NULL DEFAULT 1,
  `outstandingBalance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `isArchived` tinyint(1) NOT NULL DEFAULT 0,
  `archivedAt` datetime DEFAULT NULL,
  `vendorId` varchar(50) DEFAULT 'mrt',
  PRIMARY KEY (`id`),
  UNIQUE KEY `clientNumber` (`clientNumber`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Users Table (Secondary Login IDs)
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `clientId` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL DEFAULT 'user123',
  `role` enum('ADMIN','CLIENT','CLIENT_USER') NOT NULL DEFAULT 'CLIENT',
  `firstLogin` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `clientId` (`clientId`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Categories Table
CREATE TABLE `categories` (
  `id` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `vendorId` varchar(50) DEFAULT 'mrt',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Products Table
CREATE TABLE `products` (
  `id` varchar(50) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `categoryId` varchar(50) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Orders Table
CREATE TABLE `orders` (
  `id` varchar(50) NOT NULL, -- The REF-YYMMDD-XXXX ID
  `clientId` varchar(50) NOT NULL,
  `placedById` varchar(50) NOT NULL,
  `totalAmount` decimal(15,2) NOT NULL,
  `status` enum('PENDING','CONFIRMED','DISPATCHED','DELIVERED','ISSUE','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `deliveryDate` date NOT NULL,
  `deliveryConfirmed` tinyint(1) NOT NULL DEFAULT 0,
  `deliveryConfirmedBy` varchar(100) DEFAULT NULL,
  `deliveryConfirmedAt` datetime DEFAULT NULL,
  `deliveryIssue` text DEFAULT NULL,
  `paymentStatus` enum('PAID','PENDING','PARTIAL','OVERDUE') NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  KEY `placedById` (`placedById`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`placedById`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Order Items Table
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` varchar(50) NOT NULL,
  `productId` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `priceAtOrder` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `productId` (`productId`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Payment Logs Table
CREATE TABLE `payment_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `mode` enum('CASH','UPI','NEFT','RTGS','CHEQUE') NOT NULL,
  `refNumber` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `payment_logs_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Audit Logs Table
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` varchar(50) DEFAULT NULL,
  `userId` varchar(50) NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` text DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
