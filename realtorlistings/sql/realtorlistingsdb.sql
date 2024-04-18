-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: realtorlistingsdb.ctk682s040p6.us-west-2.rds.amazonaws.com
-- Generation Time: Apr 17, 2024 at 08:49 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `realtorlistingsdb`
CREATE DATABASE IF NOT EXISTS realtorlistingsdb;

-- Tables
CREATE TABLE IF NOT EXISTS `listings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `property_name` TEXT DEFAULT NULL,
  `address` TEXT NOT NULL,
  `realtor` TEXT NOT NULL,
  `realtor_id` INT NOT NULL,
  `agency` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `price` TEXT NOT NULL,
  `town` TEXT NOT NULL,
  `zip` TEXT NOT NULL,
  `country` TEXT NOT NULL,
  `state` TEXT NOT NULL,
  `url` TEXT NOT NULL,
  `image_path` TEXT NOT NULL,
  `status` TEXT NOT NULL,
  `type` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  KEY `fk_realtor_id` (`realtor_id`)
);

CREATE TABLE IF NOT EXISTS `SavedListings` (
  `user_id` INT NOT NULL,
  `listing_id` INT NOT NULL,
  `saved_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`user_id`, `listing_id`),
  CONSTRAINT `fk_listing_id` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` TEXT NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `tagslist` (
  `listing_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  PRIMARY KEY (`listing_id`, `tag_id`),
  CONSTRAINT `fk_listings_id` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tags_id` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` TEXT DEFAULT NULL,
  `name` TEXT NOT NULL,
  `password` TEXT NOT NULL,
  `role` VARCHAR(255) NOT NULL DEFAULT 'client',
  `agency` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `verified` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

-- Insert data into the `tags` table
INSERT INTO `tags` (`id`, `name`) VALUES
(1, 'apartment'),
(2, 'office'),
(3, 'house'),
(4, 'townhouse'),
(5, 'sale'),
(6, 'sold'),
(7, 'rent'),
(8, 'urban'),
(9, 'suburban'),
(10, 'rural'),
(11, 'town'),
(12, 'city'),
(13, 'farm'),
(14, 'industrial'),
(15, 'store');

-- Indexes and Constraints
ALTER TABLE `SavedListings`
  ADD INDEX `idx_id` (`user_id`);

ALTER TABLE `SavedListings`
  ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
